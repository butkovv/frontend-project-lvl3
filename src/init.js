import * as yup from 'yup';
import i18next from 'i18next';
import axios from 'axios';
import _ from 'lodash';
import resources from './locales';
import watch from './view';

const proxyURL = 'https://cors-anywhere.herokuapp.com/';

const schema = yup.string().url();

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
    formState: 'blank',
  };

  watch(state);

  const feedInputForm = document.querySelector('.rss-form');
  const urlInputField = document.querySelector('.form-control');

  const parseRSS = (response) => new window.DOMParser().parseFromString(response.data, 'text/xml');

  const addNewPost = (post, feedId) => {
    const title = post.querySelector('title').textContent;
    const link = post.querySelector('link').textContent;
    const newPost = {
      postId: _.uniqueId('p'),
      feedId,
      title,
      link,
    };
    state.posts = [newPost, ...state.posts];
  };

  const addNewFeed = (url, feed) => {
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
    state.feeds = [newFeed, ...state.feeds];
    const items = feed.querySelectorAll('item');
    for (let i = items.length - 1; i >= 0; i -= 1) {
      addNewPost(items[i], feedId);
    }
    state.formState = 'submitted';
  };

  const checkForNewPosts = (feed, response) => {
    const data = parseRSS(response);
    const currentTime = Date.now();
    const items = data.querySelectorAll('item');
    items.forEach((item) => {
      const pubDate = new Date(item.querySelector('pubDate').textContent);
      if ((pubDate.getTime() - feed.lastUpdated) >= 0) {
        addNewPost(item, feed.id);
      }
    });
    const activeFeed = state.feeds.find((el) => el.id === feed.id);
    activeFeed.lastUpdated = currentTime;
  };

  const updateFeeds = () => {
    const updates = state.feeds.map((feed) => axios
      .get(`${proxyURL}${feed.url}`)
      .then((response) => checkForNewPosts(feed, response))
      .catch((error) => { state.errors = [...state.errors, error]; }));
    Promise.all(updates).finally(setTimeout(updateFeeds, 15000));
  };

  const submitNewURL = (url) => {
    state.formState = 'submitting';
    axios.get(`${proxyURL}${url}`)
      .then((response) => parseRSS(response))
      .then((feed) => addNewFeed(url, feed))
      .catch((error) => { state.errors = [...state.errors, error]; });
  };

  urlInputField.addEventListener('input', (e) => {
    state.errors = [];
    const { value } = e.target;
    if (value.length === 0) {
      state.formState = 'blank';
    } else {
      try {
        schema.validateSync(value, { abortEarly: false });
        state.formState = 'valid';
      } catch (errors) {
        state.formState = 'invalid';
        errors.inner.forEach((error) => {
          state.errors.push(error.message);
        });
      }
    }
  });

  feedInputForm.addEventListener('submit', (e) => {
    e.preventDefault();
    state.errors = [];
    const formData = new FormData(e.target);
    const submittedURL = formData.get('url');
    if (state.feeds.some((element) => submittedURL === element.url)) {
      state.errors.push(i18next.t('feedback.alreadyExists'));
    } else {
      submitNewURL(submittedURL);
      updateFeeds();
    }
  });
};
