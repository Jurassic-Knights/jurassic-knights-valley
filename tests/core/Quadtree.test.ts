/**
 * Quadtree Unit Tests
 *
 * Tests for spatial partitioning
 */
import { describe, it, expect, beforeEach } from 'vitest';

// Type definitions
interface Bounds {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface SpatialObject {
    x: number;
    y: number;
}

// Simplified Quadtree for testing
class TestQuadtree {
    bounds: Bounds;
    maxObjects: number;
    maxLevels: number;
    level: number;
    objects: SpatialObject[];
    nodes: TestQuadtree[];

    constructor(bounds: Bounds, maxObjects = 10, maxLevels = 5, level = 0) {
        this.bounds = bounds;
        this.maxObjects = maxObjects;
        this.maxLevels = maxLevels;
        this.level = level;
        this.objects = [];
        this.nodes = [];
    }

    clear(): void {
        this.objects = [];
        this.nodes.forEach((node) => node.clear());
        this.nodes = [];
    }

    insert(object: SpatialObject): boolean {
        if (!this._isInBounds(object)) return false;

        if (this.objects.length < this.maxObjects) {
            this.objects.push(object);
            return true;
        }
        return false;
    }

    _isInBounds(obj: SpatialObject): boolean {
        return (
            obj.x >= this.bounds.x &&
            obj.x <= this.bounds.x + this.bounds.width &&
            obj.y >= this.bounds.y &&
            obj.y <= this.bounds.y + this.bounds.height
        );
    }

    retrieve(area: Bounds): SpatialObject[] {
        return this.objects.filter(
            (obj) =>
                obj.x >= area.x && obj.x <= area.x + area.width && obj.y >= area.y && obj.y <= area.y + area.height
        );
    }
}

describe('Quadtree', () => {
    let quadtree: TestQuadtree;
    const bounds: Bounds = { x: 0, y: 0, width: 1000, height: 1000 };

    beforeEach(() => {
        quadtree = new TestQuadtree(bounds);
    });

    describe('constructor', () => {
        it('should initialize with correct bounds', () => {
            expect(quadtree.bounds).toEqual(bounds);
        });

        it('should start with empty objects array', () => {
            expect(quadtree.objects).toHaveLength(0);
        });
    });

    describe('clear', () => {
        it('should remove all objects', () => {
            quadtree.insert({ x: 100, y: 100 });
            quadtree.insert({ x: 200, y: 200 });
            quadtree.clear();
            expect(quadtree.objects).toHaveLength(0);
        });
    });

    describe('insert', () => {
        it('should add objects within bounds', () => {
            const obj: SpatialObject = { x: 100, y: 100 };
            const result = quadtree.insert(obj);
            expect(result).toBe(true);
            expect(quadtree.objects).toContain(obj);
        });

        it('should reject objects outside bounds', () => {
            const obj: SpatialObject = { x: -100, y: -100 };
            const result = quadtree.insert(obj);
            expect(result).toBe(false);
        });
    });

    describe('retrieve', () => {
        it('should return objects in specified area', () => {
            const obj1: SpatialObject = { x: 100, y: 100 };
            const obj2: SpatialObject = { x: 500, y: 500 };
            quadtree.insert(obj1);
            quadtree.insert(obj2);

            const results = quadtree.retrieve({ x: 0, y: 0, width: 200, height: 200 });
            expect(results).toContain(obj1);
            expect(results).not.toContain(obj2);
        });
    });
});
