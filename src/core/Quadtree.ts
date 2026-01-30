/**
 * Quadtree
 * Spatial partitioning data structure for optimizing 2D range queries.
 * Used by EntityManager for rendering culling and collision detection.
 */

interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}

class Quadtree {
    bounds: Rect;
    maxObjects: number;
    maxLevels: number;
    level: number;
    objects: any[];
    nodes: Quadtree[];

    constructor(bounds: Rect, maxObjects = 10, maxLevels = 5, level = 0) {
        this.bounds = bounds; // { x, y, width, height }
        this.maxObjects = maxObjects;
        this.maxLevels = maxLevels;
        this.level = level;

        this.objects = [];
        this.nodes = [];
    }

    /**
     * Clears the quadtree
     */
    clear() {
        this.objects = [];
        for (let i = 0; i < this.nodes.length; i++) {
            if (this.nodes[i]) {
                this.nodes[i].clear();
            }
        }
        this.nodes = [];
    }

    /**
     * Split the node into 4 subnodes
     */
    split() {
        const subWidth = this.bounds.width / 2;
        const subHeight = this.bounds.height / 2;
        const x = this.bounds.x;
        const y = this.bounds.y;

        this.nodes[0] = new Quadtree(
            {
                x: x + subWidth,
                y: y,
                width: subWidth,
                height: subHeight
            },
            this.maxObjects,
            this.maxLevels,
            this.level + 1
        );

        this.nodes[1] = new Quadtree(
            {
                x: x,
                y: y,
                width: subWidth,
                height: subHeight
            },
            this.maxObjects,
            this.maxLevels,
            this.level + 1
        );

        this.nodes[2] = new Quadtree(
            {
                x: x,
                y: y + subHeight,
                width: subWidth,
                height: subHeight
            },
            this.maxObjects,
            this.maxLevels,
            this.level + 1
        );

        this.nodes[3] = new Quadtree(
            {
                x: x + subWidth,
                y: y + subHeight,
                width: subWidth,
                height: subHeight
            },
            this.maxObjects,
            this.maxLevels,
            this.level + 1
        );
    }

    /**
     * Determine which node the object belongs to
     * @param {Object} pRect Bounds of the object {x, y, width, height}
     * @return {number} Index of the subnode (0-3), or -1 if it doesn't fit completely
     */
    getIndex(pRect: Rect): number {
        let index = -1;
        const verticalMidpoint = this.bounds.x + this.bounds.width / 2;
        const horizontalMidpoint = this.bounds.y + this.bounds.height / 2;

        // Object can completely fit within the top quadrants
        const topQuadrant =
            pRect.y < horizontalMidpoint && pRect.y + pRect.height < horizontalMidpoint;
        // Object can completely fit within the bottom quadrants
        const bottomQuadrant = pRect.y > horizontalMidpoint;

        // Object can completely fit within the left quadrants
        if (pRect.x < verticalMidpoint && pRect.x + pRect.width < verticalMidpoint) {
            if (topQuadrant) {
                index = 1;
            } else if (bottomQuadrant) {
                index = 2;
            }
        }
        // Object can completely fit within the right quadrants
        else if (pRect.x > verticalMidpoint) {
            if (topQuadrant) {
                index = 0;
            } else if (bottomQuadrant) {
                index = 3;
            }
        }

        return index;
    }

    /**
     * Insert the object into the quadtree
     */
    insert(pRect: Rect) {
        if (this.nodes.length) {
            const index = this.getIndex(pRect);

            if (index !== -1) {
                this.nodes[index].insert(pRect);
                return;
            }
        }

        this.objects.push(pRect);

        if (this.objects.length > this.maxObjects && this.level < this.maxLevels) {
            if (this.nodes.length === 0) {
                this.split();
            }

            let i = 0;
            while (i < this.objects.length) {
                const index = this.getIndex(this.objects[i]);
                if (index !== -1) {
                    this.nodes[index].insert(this.objects.splice(i, 1)[0]);
                } else {
                    i++;
                }
            }
        }
    }

    /**
     * Return all objects that could collide with the given object
     * @param {Object} pRect Bounds of the object
     * @return {Array} Array of objects
     */
    retrieve(pRect: Rect): any[] {
        let returnObjects = this.objects;
        const index = this.getIndex(pRect);

        if (index !== -1 && this.nodes.length) {
            returnObjects = returnObjects.concat(this.nodes[index].retrieve(pRect));
        } else if (this.nodes.length) {
            // If it doesn't fit in a child, it might span multiple children or be in this node.
            // If checking for intersection (like rendering viewport), we need ALL children potentially.
            // Standard retrieve usually returns candidates for *collision*.
            // For Viewport Query, we likely want a different method 'queryRect' that checks overlaps exactly.
            // For now, let's just return all from subnodes if we span the split.
            for (let i = 0; i < this.nodes.length; i++) {
                returnObjects = returnObjects.concat(this.nodes[i].retrieve(pRect));
            }
        }

        return returnObjects;
    }

    /**
     * Precise Rect Query: Returns unique objects intersecting the range
     */
    queryRect(range: any, found: any[] = []) {
        // Check if this Quadtree node intersects the range
        if (!this.intersects(this.bounds, range)) {
            return found;
        }

        // Check objects in this node
        for (const obj of this.objects) {
            if (this.intersects(obj, range)) {
                found.push(obj);
            }
        }

        // Check children
        if (this.nodes.length) {
            for (const node of this.nodes) {
                node.queryRect(range, found);
            }
        }

        return found;
    }

    intersects(a: Rect, b: Rect) {
        return (
            a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y
        );
    }
}

// ES6 Module Export
export { Quadtree };
