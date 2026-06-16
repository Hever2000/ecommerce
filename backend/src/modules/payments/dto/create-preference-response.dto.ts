export class CreatePreferenceResponseDto {
  preferenceId: string;
  initPoint: string;
  sandboxInitPoint: string;
  items: {
    id: string;
    title: string;
    quantity: number;
    unitPrice: number;
  }[];
  total: number;
}
