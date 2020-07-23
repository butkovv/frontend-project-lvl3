import * as yup from 'yup';
import i18next from 'i18next';
import axios from 'axios';
import _ from 'lodash';
import resources from './locales';
import watch from './view';

const proxyURL = 'https://cors-anywhere.herokuapp.com/';

export default () => {
  i18next.init({
    lng: 'en',
    debug: true,
    resources,
  });

  const state = {
    feeds: [],
    posts: [],
    errors: [],
    inputState: 'blank',
    submissionState: '',
  };

  const urlSchema = yup.string().url();
  watch(state);

  const feedInputForm = document.querySelector('.rss-form');
  const urlInputField = document.querySelector('.form-control');

  const parseRSS = (data) => new window.DOMParser().parseFromString(data, 'text/xml');

  const processPost = (post, feedId) => {
    const title = post.querySelector('title').textContent;
    const link = post.querySelector('link').textContent;
    const newPost = {
      postId: _.uniqueId('p'),
      feedId,
      title,
      link,
    };
    return newPost;
  };

  const processFeed = (url, data) => {
    const feed = parseRSS(data);
    const title = feed.querySelector('title').textContent;
    const description = feed.querySelector('description').textContent;
    const lastUpdated = Date.now();
    const feedId = _.uniqueId('f');
    const newFeed = {
      id: feedId,
      url,
      title,
      description,
      lastUpdated,
    };
    const posts = [];
    const items = feed.querySelectorAll('item');
    for (let i = items.length - 1; i >= 0; i -= 1) {
      const post = processPost(items[i], feedId);
      posts.unshift(post);
    }
    return { feed: newFeed, posts };
  };

  const checkForNewPosts = (feed, data) => {
    const updatedFeed = parseRSS(data);
    const currentTime = Date.now();
    const items = updatedFeed.querySelectorAll('item');
    items.forEach((item) => {
      const pubDate = new Date(item.querySelector('pubDate').textContent);
      if ((pubDate.getTime() - feed.lastUpdated) >= 0) {
        const post = processPost(item, feed.id);
        state.posts = [post, ...state.posts];
      }
    });
    const activeFeed = state.feeds.find((el) => el.id === feed.id);
    activeFeed.lastUpdated = currentTime;
  };

  const updateFeeds = () => {
    const updates = state.feeds.map((feed) => axios
      .get(`${proxyURL}${feed.url}`)
      .then((response) => checkForNewPosts(feed, response.data))
      .catch((error) => { state.errors = [...state.errors, error]; }));
    Promise.all(updates).finally(setTimeout(updateFeeds, 15000));
  };

  const addFeed = (url) => {
    state.submissionState = 'submitting';
    axios.get(`${proxyURL}${url}`)
      .then((response) => {
        const { feed, posts } = processFeed(url, response.data);
        state.feeds = [feed, ...state.feeds];
        state.posts = [...posts, ...state.posts];
        state.submissionState = 'submitted';
        state.inputState = 'blank';
      })
      .catch((error) => {
        state.errors = [...state.errors, error];
        state.submissionState = 'submissionFailed';
      });
  };

  const validateValue = (value) => {
    const urls = state.feeds.map((feed) => feed.url);
    const duplicationSchema = yup.mixed().notOneOf(urls, i18next.t('feedback.alreadyExists'));
    const validationErrors = [];
    try {
      urlSchema.validateSync(value, { abortEarly: false });
    } catch (errors) {
      errors.inner.forEach((error) => {
        validationErrors.push(error.message);
      });
    }
    try {
      duplicationSchema.validateSync(value, { abortEarly: false });
    } catch (errors) {
      errors.inner.forEach((error) => {
        validationErrors.push(error.message);
      });
    }
    return validationErrors;
  };

  urlInputField.addEventListener('input', (e) => {
    state.errors = [];
    const { value } = e.target;
    if (value.length === 0) {
      state.inputState = 'blank';
    } else {
      const errors = validateValue(value);
      if (errors.length === 0) {
        state.inputState = 'valid';
      } else {
        state.errors = [...errors];
        state.inputState = 'invalid';
      }
    }
  });

  feedInputForm.addEventListener('submit', (e) => {
    e.preventDefault();
    state.errors = [];
    const formData = new FormData(e.target);
    const submittedURL = formData.get('url');
    addFeed(submittedURL);
    updateFeeds();
  });
};
