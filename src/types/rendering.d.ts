import { IEntity } from './core';

export interface IEntityRenderer {
    render(ctx: CanvasRenderingContext2D, entity: IEntity, includeShadow?: boolean, alpha?: number): void;
    drawShadow?(ctx: CanvasRenderingContext2D, entity: IEntity, blur?: boolean): void;
    renderShadow?(ctx: CanvasRenderingContext2D, entity: IEntity, blur?: boolean): void; // Alias
}

export interface RendererCollection {
    hero?: IEntity | null;
    heroRenderer: IEntityRenderer | null;
    dinosaurRenderer: IEntityRenderer | null;
    resourceRenderer: IEntityRenderer | null;
}
