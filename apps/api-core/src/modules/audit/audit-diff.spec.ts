import { changedFields } from './audit-diff';

describe('changedFields', () => {
  it('devolve só as colunas que mudaram', () => {
    expect(
      changedFields(
        { professorComments: null, isCorrect: false },
        { professorComments: 'Revise o caso base', isCorrect: false },
      ),
    ).toEqual({
      before: { professorComments: null },
      after: { professorComments: 'Revise o caso base' },
    });
  });

  it('retorna null quando os valores são iguais', () => {
    expect(
      changedFields({ desativado: true }, { desativado: true }),
    ).toBeNull();
  });

  it('serializa datas', () => {
    const before = new Date('2026-01-01T00:00:00.000Z');
    const after = new Date('2026-02-01T00:00:00.000Z');

    expect(changedFields({ deletedAt: before }, { deletedAt: after })).toEqual({
      before: { deletedAt: '2026-01-01T00:00:00.000Z' },
      after: { deletedAt: '2026-02-01T00:00:00.000Z' },
    });
  });
});
