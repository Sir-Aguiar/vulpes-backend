import { getFeedbacksQuerySchema } from './get-feedbacks.dto';

describe('getFeedbacksQuerySchema', () => {
  it('desliga o widget quando o parâmetro não vem', () => {
    expect(getFeedbacksQuerySchema.parse({}).isWidget).toBe(false);
  });

  it('trata a string false como falso', () => {
    expect(getFeedbacksQuerySchema.parse({ isWidget: 'false' }).isWidget).toBe(
      false,
    );
  });

  it('trata a string true como verdadeiro', () => {
    expect(getFeedbacksQuerySchema.parse({ isWidget: 'true' }).isWidget).toBe(
      true,
    );
  });

  it('aceita booleano já convertido', () => {
    expect(getFeedbacksQuerySchema.parse({ isWidget: false }).isWidget).toBe(
      false,
    );
    expect(getFeedbacksQuerySchema.parse({ isWidget: true }).isWidget).toBe(
      true,
    );
  });
});
