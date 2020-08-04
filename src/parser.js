import _ from 'lodash';

const processPost = (post, feedId) => {
  const title = post.querySelector('title').textContent;
  const link = post.querySelector('link').textContent;
  const publicationDate = new Date(post.querySelector('pubDate').textContent);
  const newPost = {
    postId: _.uniqueId('p'),
    feedId,
    title,
    link,
    publicationDate,
  };
  return newPost;
};

export default (xml) => {
  const document = new window.DOMParser().parseFromString(xml, 'text/xml');
  const title = document.querySelector('title').textContent;
  const description = document.querySelector('description').textContent;
  const lastUpdated = Date.now();
  const feedId = _.uniqueId('f');
  const feed = {
    id: feedId,
    title,
    description,
    lastUpdated,
  };
  const posts = [];
  const items = document.querySelectorAll('item');
  items.forEach((item) => {
    const post = processPost(item, feedId);
    posts.push(post);
  });
  return { feed, posts };
};
