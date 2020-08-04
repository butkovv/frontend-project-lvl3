import * as yup from 'yup';
import i18next from 'i18next';
import axios from 'axios';

import resources from './locales';
import watch from './view';
import parseRSS from './parser';

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
    form: {
      inputState: 'blank',
      submissionState: 'awaiting',
      errors: [],
    },
  };

  const urlSchema = yup.string().url();
  watch(state);

  const feedInputForm = document.querySelector('.rss-form');
  const urlInputField = document.querySelector('.form-control');

  const addNewPosts = (feed, xml) => {
    const { posts } = parseRSS(xml);
    const currentTime = Date.now();
    posts.forEach((post) => {
      const { publicationDate } = post;
      if ((publicationDate.getTime() - feed.lastUpdated) >= 0) {
        state.posts.unshift(post);
      }
    });
    const activeFeed = state.feeds.find((el) => el.id === feed.id);
    activeFeed.lastUpdated = currentTime;
  };

  const updateFeeds = () => {
    const updates = state.feeds.map((feed) => axios
      .get(`${proxyURL}${feed.url}`)
      .then((response) => addNewPosts(feed, response.data))
      .catch((error) => { state.errors = [...state.errors, error]; }));
    Promise.all(updates).finally(setTimeout(updateFeeds, 15000));
  };

  const addFeed = (url) => {
    state.errors = [];
    state.form.submissionState = 'submitting';
    axios.get(`${proxyURL}${url}`)
      .then((response) => {
        const { feed, posts } = parseRSS(response.data);
        state.feeds.unshift({ ...feed, url });
        state.posts = [...posts, ...state.posts];
        state.form.submissionState = 'submitted';
        state.form.inputState = 'blank';
      })
      .catch((error) => {
        state.errors = [...state.errors, error];
        state.form.submissionState = 'submissionFailed';
      });
  };

  const validateValue = (value) => {
    const urls = state.feeds.map((feed) => feed.url);
    try {
      urlSchema.notOneOf(urls, i18next.t('feedback.alreadyExists')).validateSync(value, { abortEarly: false });
      return null;
    } catch (error) {
      return error.message;
    }
  };

  urlInputField.addEventListener('input', (e) => {
    state.form.submissionState = 'awaiting';
    state.form.errors = [];
    state.errors = [];
    const { value } = e.target;
    if (value.length === 0) {
      state.form.inputState = 'blank';
    } else {
      const error = validateValue(value);
      if (!error) {
        state.form.inputState = 'valid';
      } else {
        state.form.errors = [error];
        state.form.inputState = 'invalid';
      }
    }
  });

  feedInputForm.addEventListener('submit', (e) => {
    e.preventDefault();
    state.form.errors = [];
    state.errors = [];
    const formData = new FormData(e.target);
    const submittedURL = formData.get('url');
    addFeed(submittedURL);
    updateFeeds();
  });
};
