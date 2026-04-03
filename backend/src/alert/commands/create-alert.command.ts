import { AlertDirection } from '../schemas/alert.schema';

export class CreateAlertCommand {
  constructor(
    public readonly userId: string,
    public readonly thresholdPrice: number,
    public readonly direction: AlertDirection,
  ) {}
}
