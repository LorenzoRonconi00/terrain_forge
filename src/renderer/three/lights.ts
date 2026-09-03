import { DirectionalLight, HemisphereLight, type Light } from 'three'

export function createLights(): Light[] {
    const sky = new HemisphereLight(0xbfd4ff, 0x2b2b33, 1.1)

    const sun = new DirectionalLight(0xffffff, 2.2)
    sun.position.set(12, 18, 8)

    return [sky, sun]
}