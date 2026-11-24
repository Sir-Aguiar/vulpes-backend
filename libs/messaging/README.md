# Messaging

Biblioteca compartilhada de mensagens. Cada aplicação Nest registra `MessagingModule` uma vez e conversa com as outras pelo RabbitMQ. Feature module de negócio não abre outra conexão: injeta o publisher do assunto que precisa publicar.

## Estrutura

```text
libs/messaging/
  README.md
  src/
    index.ts
    messaging.module.ts
    rabbitmq.options.ts
    connection/
      rabbitmq.connection.ts
    transport/
      publisher.ts
      consumer.ts
    contracts/
      ping.contract.ts
    ping/
      ping.topology.ts
      ping.publisher.ts
      ping.consumer.ts
```

## O que cada diretório significa

`connection` abre um canal por processo, reconecta quando a conexão cai e fecha os dois no shutdown. Não conhece exchange, fila nem payload.

`transport` publica e consome sem saber o assunto. `Publisher.publish` manda um JSON para um exchange. `Publisher.rpc` cria a fila temporária de resposta, correlaciona pelo `correlationId` e aplica timeout. `Consumer` faz prefetch, entrega a mensagem e registra a fila para não consumir duas vezes.

`contracts` é o acordo entre os serviços: nome do exchange, routing key, fila e o formato do payload. Os dois lados importam daqui. Não há conexão nem regra de negócio.

Cada assunto fica num diretório irmão de `ping`. Ali moram a topologia (`assert` do exchange, da fila e do bind), o publisher usado por quem envia e o consumer usado por quem escuta. O consumer só sobe se o nome dele estiver em `RabbitmqOptions.consumers`.

`messaging.module.ts` registra conexão, transporte e os assuntos no Nest. Exporte o publisher do assunto para o app que publica. O consumer fica interno: o `OnModuleInit` basta para ele começar a escutar.

`rabbitmq.options.ts` guarda a URL e a lista de consumers deste processo. Quem só publica passa `consumers: []`.

## Como organizar o próximo assunto

Pontos, level up e achievements são assuntos diferentes. Cada um ganha o próprio diretório, no mesmo formato do ping. Não crie outro `MessagingModule` nem outra conexão.

```text
src/
  contracts/
    ping.contract.ts
    points.contract.ts
    level-up.contract.ts
    achievements.contract.ts
  ping/
  points/
    points.topology.ts
    points.publisher.ts
    points.consumer.ts
  level-up/
    level-up.topology.ts
    level-up.publisher.ts
    level-up.consumer.ts
  achievements/
    achievements.topology.ts
    achievements.publisher.ts
    achievements.consumer.ts
```

Passos para um assunto novo:

1. Crie `contracts/<assunto>.contract.ts` com exchange, routing key, fila e os tipos do payload.
2. Crie `<assunto>/<assunto>.topology.ts` com o `assert` idempotente dessa topologia.
3. Crie o publisher se algum serviço envia. Ele declara a topologia e chama `Publisher`.
4. Crie o consumer se algum serviço escuta. Ele declara a topologia, chama `Consumer` e trata ack.
5. Inclua o nome em `MESSAGING_CONSUMERS` e registre publisher e consumer no `MessagingModule`.
6. No app que escuta, passe esse nome em `consumers`. No app que só publica, não inclua.

Um fluxo em que o game-service avisa o api-core ("subiu de nível") usa o mesmo canal: o publisher fica no game-service e o consumer no api-core. O contrato continua único, dentro desta lib.
