
export interface BarcodeItem {
  id: string;
  itemName: string;
  itemCode: string; // The 12-digit code for EAN13 generation
  mrp: number;
  timestamp: number;
}
