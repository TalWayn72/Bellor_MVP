export function createPageUrl(pageName: string) {
    return '/' + pageName.replace(/ /g, '-');
}

export { transformUser, formatLocation, calculateAge } from './userTransformer.js';