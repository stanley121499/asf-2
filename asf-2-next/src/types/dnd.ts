// src/types.ts

export interface ElementProps {
  id: string;
  type: string;
  properties: {
    [key: string]: any;
    targetId?: string;
    amount?: number;
    contentType?: string;
  };
}
