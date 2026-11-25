# Mecânicas de gamificação

> Em um app educacional, a gamificação deve premiar **aprendizado e consistência**, não só volume.

## Princípios

1. **Baseado em eventos do backend.** O `game-service` não aceita "ganhei X XP" vindo do frontend. Ele reage a eventos emitidos pelo `api-core` (ex.: submissão registrada como correta).
2. **Idempotente.** Reprocessar o mesmo evento não pode gerar XP duplicado.
3. **XP total é a fonte da verdade.** O nível é sempre calculado a partir do XP acumulado, nunca guardado como dado independente que possa divergir.
4. **Sem farm.** Cada tarefa rende XP base uma única vez por usuário, independentemente de quantas vezes for reenviada ou em quais contextos.

---

# XP

## O que gera XP

| Evento                                   | XP             | Observações                        |
| ---------------------------------------- | -------------- | ---------------------------------- |
| Primeira resolução correta de uma tarefa | 10 a 50 (base) | Escala com a dificuldade da tarefa |
| Resolver lista antes do prazo            | Bônus          | Uma vez por lista                  |
| Resolver tarefa pública, fora de turma   | Base reduzida  | Ver "Contextos" abaixo             |

Os bônus não são fixos no código: são **regras guardadas no Firestore** (ver "Regras de bônus" abaixo). As regras abaixo são apenas o _seed_ inicial:

| Regra                                      | Bônus | Aplicável a (`appliesTo`) | Condição                                             |
| ------------------------------------------ | ----- | ------------------------- | ---------------------------------------------------- |
| Resolver de primeira, sem erros anteriores | +10%  | `SUBMISSION_CORRECT`      | `firstTry == true`                                   |
| Entregar a lista antes do prazo            | +10%  | `LIST_SUBMITTED`          | `onTime == true`                                     |
| Primeiro a entregar a lista toda correta   | +20%  | `LIST_SUBMITTED`          | `isFirstPerfectDelivery == true`                     |

> O valor base (10 a 50, escalando com a dificuldade) continua definido pelo código/configuração. O que vai para o banco são os **bônus**.

## Contexto da resolução

Uma mesma tarefa pode ser resolvida em dois contextos:

- **Turma:** a submissão está associada a uma lista de uma turma (`classTaskListId`).
- **Pública:** a submissão não tem vínculo com turma (tarefa `isPublic`).

### Regra proposta: XP base uma vez por tarefa

O XP base é controlado por **`(userId, taskId)`**, independentemente do contexto. Isso evita contar duas vezes a mesma tarefa (turma e pública) e também cobre o caso de resolver primeiro de forma pública e depois dentro de uma lista.

| Cenário                                | Resultado                                                                                       |
| -------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Resolve na turma e depois publicamente | Sem novo XP base                                                                                |
| Resolve publicamente e depois na lista | Recebe apenas a **diferença** entre a base de turma e o que já recebeu (a base pública é menor) |
| Reenvia uma tarefa já resolvida        | Nada                                                                                            |

Os **bônus de lista** (entrega antes do prazo, primeiro a entregar tudo correto) são independentes do XP base, pois pertencem à lista, e não à tarefa. Assim, quem resolveu antes de forma pública ainda é recompensado por entregar a lista no prazo.

> **Decisão em aberto:** o complemento de XP (público → turma) é a abordagem sugerida. A alternativa mais simples é não dar nada ao resolver na turma depois de já ter resolvido publicamente. Escolher uma antes de implementar.

## Como funciona o fluxo

1. O aluno executa o código no navegador (Web Worker). **Isso não gera XP**, pois a execução roda no cliente e não é confiável.
2. O aluno **envia a solução**. O `api-core` registra a `Submission` com `isCorrect`.
3. O `api-core` emite um evento para o `game-service` com os **fatos** necessários. Há dois tipos de evento:

   ```
   SUBMISSION_CORRECT {            // submissão de uma tarefa registrada como correta
     eventId, userId, taskId,
     classId?, classTaskListId?,
     firstTry, submittedAt
   }

   LIST_SUBMITTED {                // aluno enviou a lista com todas as tarefas corretas
     eventId, userId, listId, classId,
     onTime,
     isFirstPerfectDelivery,
     submittedAt
   }
   ```

4. O `game-service`:
   - descarta o evento se `eventId` já foi processado (idempotência);
   - para `SUBMISSION_CORRECT`, verifica se já houve XP base para `(userId, taskId)`;
   - seleciona as regras de bônus cujo `appliesTo` contém o evento e avalia as condições;
   - calcula o XP (base + bônus aplicáveis, de forma aditiva), grava o registro no histórico e soma ao total do usuário;
   - recalcula o nível.

## Primeiro a entregar a lista toda correta

O bônus "primeiro a entregar" exige estado de **outros alunos**, então a decisão é tomada pelo `api-core` (que tem as `Submission`) e enviada ao `game-service` como o fato `isFirstPerfectDelivery`:

1. O aluno envia a lista e todas as tarefas estão corretas.
2. O `api-core` verifica se **já existe algum aluno da turma** que entregou essa lista toda correta.
   - Se existir: `isFirstPerfectDelivery = false`. Nenhum bônus de "primeiro".
   - Se não existir: `isFirstPerfectDelivery = true`.
3. O evento `LIST_SUBMITTED` é enviado com a flag, e a regra de bônus avalia o fato como qualquer outra condição.

Pontos importantes:

- **Não basta ser o primeiro a enviar.** Só conta quem enviou a lista com **tudo correto**. Uma entrega incompleta ou com erros nunca "toma" o primeiro lugar de ninguém.
- **A verificação deve ser atômica.** Dois alunos podem terminar ao mesmo tempo, e só um pode receber a flag. O `api-core` deve garantir isso (por exemplo, com uma restrição de unicidade por `listId` em um registro de "primeira entrega perfeita", gravado em transação).
- O `game-service` **não decide** isso: ele apenas confia no fato recebido do `api-core`.
- A flag é por lista e por turma, pois uma mesma lista pertence a uma turma.

---

# Regras de bônus

Os bônus ficam no Firestore e são aplicados a partir dele, o que permite ajustar o balanceamento (ou criar bônus temporários) sem deploy.

## Princípios

- As condições são **declarativas** (dados interpretados pelo código), nunca código executável.
- Os bônus se combinam de forma **aditiva**.
- Uma regra só é considerada se o evento estiver em `appliesTo`. Regras fora do evento nem são avaliadas.

## Formato de uma regra (proposta, ainda sujeita a ajuste)

```
{
  ruleId: "first_try",
  active: true,
  appliesTo: ["SUBMISSION_CORRECT"],
  conditions: [
    { fact: "firstTry", op: "==", value: true }
  ],
  bonus: { type: "PERCENT", value: 10 },
  updatedAt: <timestamp>
}
```

- `appliesTo`: lista de eventos para os quais a regra existe. Se o evento recebido não estiver na lista, a regra é ignorada.
- `conditions`: lista de condições, todas precisam ser verdadeiras (AND). Só se adiciona OR se houver necessidade real.
- `bonus`: por enquanto só percentual.
- `active`: permite desligar uma regra sem apagá-la.

## Fatos e operadores

Os **fatos** disponíveis vêm de um conjunto fixo fornecido pelo código, a partir dos dados do evento. Inicialmente:

| Fato                     | Evento(s)                                  |
| ------------------------ | ------------------------------------------ |
| `firstTry`               | `SUBMISSION_CORRECT`                       |
| `onTime`                 | `LIST_SUBMITTED`                           |
| `isFirstPerfectDelivery` | `LIST_SUBMITTED`                           |

Operadores iniciais: `==`, `!=`, `>`, `>=`, `<`, `<=`, `in`.

> O banco define _quais regras valem e com que valores_. O código define _quais fatos existem_. Um fato novo exige código.

## Combinação (aditiva)

Os percentuais das regras aplicáveis são somados e aplicados sobre o XP base:

```
xpTotal = xpBase * (1 + soma(percentuais) / 100)
```

Exemplo: base 40, regras de +10% e +20% aplicáveis → `40 * 1,30 = 52`.

> **Decisão em aberto:** definir um **teto** para o bônus total (ex.: +100%), para evitar que uma regra mal cadastrada gere XP absurdo. Recomendado, mas ainda não decidido.

## Histórico de XP (snapshot)

Ao conceder XP, o `game-service` grava um registro com o que foi aplicado **naquele momento**, para o histórico continuar explicável mesmo que as regras mudem depois:

```
{
  eventId, userId, event: "LIST_SUBMITTED",
  base: 40,
  applied: [
    { ruleId: "on_time", percent: 10 },
    { ruleId: "first_perfect_delivery", percent: 20 }
  ],
  total: 52,
  createdAt: <timestamp>
}
```

Esse registro também serve para auditoria e para responder reclamações do tipo "faltou XP". O `eventId` pode ser usado como ID do documento, o que ajuda na idempotência.

## Cache das regras

As regras mudam pouco, então o `game-service` não lê o Firestore a cada evento. Um serviço em memória (`RulesCacheService`) mantém as regras e é atualizado por um **listener do Firestore (`onSnapshot`)** na coleção de regras.

### Por que listener

- Qualquer criação, atualização ou exclusão atualiza o cache, **independentemente de quem escreveu** (endpoint, outro serviço ou console do Firestore).
- Funciona com **várias instâncias** do `game-service`, pois cada uma tem seu próprio listener.
- O primeiro snapshot entrega todos os documentos como `added`, então ele substitui uma carga inicial separada.

### Funcionamento

1. No boot (`onModuleInit`), o serviço assina a coleção de regras.
2. A cada snapshot, percorre `docChanges()` e atualiza o `Map<ruleId, regra>` em memória:
   - `added` e `modified`: grava a regra no cache;
   - `removed`: remove a regra do cache;
   - regra com `active == false`: também é removida do cache (o cache guarda só regras ativas).
3. No encerramento (`onModuleDestroy`), cancela a assinatura.
4. A leitura (`getByEvent(evento)`) devolve as regras cujo `appliesTo` contém o evento.

### Garantias e cuidados

- **Prontidão:** a aplicação só deve processar eventos depois do **primeiro snapshot**. Caso contrário, o cache estaria vazio e o XP sairia sem bônus. O `onModuleInit` espera uma `Promise` resolvida no primeiro callback.
- **Falhas do listener:** o SDK reconecta sozinho. Se o listener for encerrado com erro, o serviço registra o erro, **mantém a última versão válida** em memória e tenta assinar novamente.
- **Consistência no cálculo:** ao processar um evento, o avaliador pega uma **cópia** das regras aplicáveis no início e a usa até o fim. Assim, uma alteração no meio do cálculo não gera um resultado misto, e o `applied` gravado no histórico corresponde exatamente às regras usadas.
- **Isolamento:** o acesso ao Firestore fica atrás de um repositório (como `UserRepository`), para o `RulesCacheService` ser testável com um repositório falso que dispara `added`, `modified` e `removed`.
- **Índice por evento:** com poucas regras, filtrar por `appliesTo` a cada leitura basta. Se o volume crescer, manter um `Map<evento, regras[]>`.

> Alternativa futura, se houver muitas instâncias ou necessidade de invalidação controlada: canal pub/sub no Redis (já usado pelo `api-core`). Não é necessário agora.

## Cuidados

- Validar o formato da regra ao gravar (fato e operador conhecidos, percentual dentro de um intervalo).
- Escrita das regras apenas pelo backend/administração, nunca pelo cliente.
- Testes unitários do avaliador: nenhuma regra, uma elegível, duas elegíveis, regra inativa, regra fora de `appliesTo`.
- Testes unitários do cache: carga inicial, `added`, `modified`, `removed`, regra desativada e falha do listener.

---

# Level up

O usuário sobe de nível conforme acumula XP total.

- Cada nível tem um **XP mínimo** (inclusive) e um **XP máximo** (exclusivo, igual ao mínimo do nível seguinte).
- O nível é derivado do XP total, por uma função determinística. Sugestão de curva:

  ```
  xpMinimoDoNivel(n) = 100 * (n - 1) ^ 1.5
  ```

  | Nível | XP mínimo |
  | ----- | --------- |
  | 1     | 0         |
  | 2     | 100       |
  | 3     | ~283      |
  | 4     | ~520      |
  | 5     | 800       |

- O XP nunca diminui, então o nível também nunca diminui.

> Hoje o documento do usuário no Firestore guarda `xp` e `level`. Se `level` continuar sendo persistido, ele deve ser atualizado na mesma transação que o XP, para nunca divergir.

---

# Badges

Badges são **certificados de nível**: o usuário recebe um quando atinge um determinado nível (ou seja, um limiar de XP).

- Os badges têm uma definição fixa, por exemplo: nível 5, 10, 20, 30.
- Cada badge é concedido **uma única vez** e guarda a data em que foi obtido.
- Como dependem só do nível, são avaliados no momento em que o usuário sobe de nível.

> Badges de nível são diferentes de **conquistas** (abaixo), que dependem de comportamentos específicos.

---

# Leaderboard

Lista de usuários ordenada por XP total, do maior para o menor.

- **Desempate:** quem atingiu o XP atual primeiro fica na frente (exige guardar a data da última alteração de XP).
- **Escopos sugeridos:**
  - por turma (o mais relevante para os alunos);
  - por instituição;
  - global (opcional).
- Mostrar a posição do próprio usuário, mesmo que ele esteja fora do topo (ex.: 2 posições acima e abaixo).

> **Decisões em aberto:** quais escopos entram na primeira versão, e se o professor pode desativar o ranking da própria turma.

---

# Conquistas

> Ainda por definir
