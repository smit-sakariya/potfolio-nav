export class UpdateHoldingCommand {
  constructor(
    public readonly userId: string,
    public readonly asset: string,
    public readonly quantity: number,
    public readonly averageBuyPrice: number,
  ) {}
}
