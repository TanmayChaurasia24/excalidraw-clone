export type ELEMENT_TYPE = 'RECTANGLE' | 'CIRCLE' | 'ARROW' | 'PENCIL' | 'SQUARE' | 'PEN' | 'TEXT' | 'ARROW' | 'IMAGE';

export interface CanvasElement {
    id: String;
    type: ELEMENT_TYPE;
    x: number;
    y: number;
    width: number;
    height: number;
    properties?: any;
    roomId: string;
    creatorId: number;
    zindex: string;
}

export interface WsMessage {
  type: 'DRAWING_UPDATE' | 'DRAWING_COMMIT' | 'JOIN_ROOM';
  roomId: number;
  element?: CanvasElement;
}