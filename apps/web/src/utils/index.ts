export function createPageUrl(pageName: string) {
    return '/' + pageName.replace(/ /g, '-');
}

export { transformUser, formatLocation, calculateAge } from './userTransformer.js';
export {
  transformResponse, transformResponses,
  transformLike, transformLikes,
  transformComment, transformComments,
  transformStory, transformFollow,
} from './responseTransformer.js';