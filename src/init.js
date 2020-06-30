import { watch } from 'melanke-watchjs';
import * as yup from 'yup';
import i18next from 'i18next';
import axios from 'axios';
import resources from './locales';

const proxyURL = 'https://cors-anywhere.herokuapp.com/';

const schema = yup.object().shape({
  url: yup.string().url(),
});

export default () => {
  i18next.init({
    lng: 'en',
    debug: true,
    resources,
  });

  const state = {
    currentFeedID: 0,
    currentPostID: 0,
    feeds: [],
    posts: [],
    errors: [],
    formState: 'valid',
  };
  const feedInputForm = document.querySelector('.rss-form');
  const urlInputField = document.querySelector('input[name=url]');
  const feedback = document.querySelector('.feedback');
  const mainContainer = document.querySelector('.container');

  const outputRow = document.createElement('div');
  outputRow.classList.add('row', 'ml-1');
  mainContainer.appendChild(outputRow);
  const feedsDisplay = document.createElement('div');
  feedsDisplay.classList.add('col');
  const streamDisplay = document.createElement('div');
  streamDisplay.classList.add('col');
  outputRow.appendChild(feedsDisplay);
  outputRow.appendChild(streamDisplay);

  const parseRSS = (rss) => {
    const parsedData = new window.DOMParser().parseFromString(rss, 'text/xml');
    return parsedData;
  };

  const addNewFeed = (url, data) => {
    const title = data.querySelector('title').textContent;
    const description = data.querySelector('description').textContent;
    const lastUpdated = Date.now();
    const newFeed = {
      id: state.currentFeedID,
      url,
      title,
      description,
      lastUpdated,
    };
    state.feeds = [...state.feeds, newFeed];
    const items = data.querySelectorAll('item');
    for (let i = items.length - 1; i >= 0; i -= 1) {
      const item = items[i];
      const itemTitle = item.querySelector('title').textContent;
      const itemLink = item.querySelector('link').textContent;
      const newPost = {
        postId: state.currentPostId,
        feedId: state.currentFeedID,
        title: itemTitle,
        link: itemLink,
      };
      state.posts = [newPost, ...state.posts];
      state.currentPostID += 1;
    }
    state.currentFeedID += 1;
  };

  const checkForNewPosts = (feed, data) => {
    const currentTime = Date.now();
    const items = data.querySelectorAll('item');
    items.forEach((item) => {
      const pubDate = new Date(item.querySelector('pubDate').textContent);
      if ((pubDate.getTime() - feed.lastUpdated) >= 0) {
        const itemTitle = item.querySelector('title').textContent;
        const itemLink = item.querySelector('link').textContent;
        const newPost = {
          postId: state.currentPostId,
          feedId: feed.id,
          title: itemTitle,
          link: itemLink,
        };
        state.posts = [newPost, ...state.posts];
        state.currentPostID += 1;
      }
    });
    const activeFeed = state.feeds.find((el) => el.id === feed.id);
    activeFeed.lastUpdated = currentTime;
  };

  const updateFeeds = () => {
    state.feeds.forEach((feed) => {
      axios.get(`${proxyURL}${feed.url}`)
        .then((response) => parseRSS(response.data))
        .then((data) => checkForNewPosts(feed, data))
        .catch((error) => { state.errors = [...state.errors, error]; });
    });
    setTimeout(updateFeeds, 15000);
  };

  const submitNewURL = (url) => {
    state.formState = 'inactive';
    axios.get(`${proxyURL}${url}`)
      .then((response) => parseRSS(response.data))
      .then((data) => addNewFeed(url, data))
      .catch((error) => { state.errors = [...state.errors, error]; })
      .then(() => { state.formState = 'submitted'; });
  };

  const renderFeedDisplay = () => {
    feedsDisplay.innerHTML = '';
    state.feeds.forEach((feed) => {
      const feedDiv = document.createElement('div');
      feedDiv.classList.add('row');
      feedDiv.textContent = `${feed.title} — ${feed.description}`;
      feedsDisplay.prepend(feedDiv);
    });
  };

  const renderStreamDisplay = () => {
    streamDisplay.innerHTML = '';
    for (let i = state.posts.length - 1; i > 0; i -= 1) {
      const post = state.posts[i];
      const postDiv = document.createElement('div');
      postDiv.classList.add('row');
      postDiv.innerHTML = `<a href='${post.link}'>${post.title}</a>`;
      streamDisplay.prepend(postDiv);
    }
  };

  const renderErrors = () => {
    feedback.textContent = '';
    if (state.errors.length > 0) {
      state.errors.forEach((error) => {
        const feedbackDiv = document.createElement('div');
        feedbackDiv.classList.add('text-danger');
        feedbackDiv.textContent = error;
        feedback.appendChild(feedbackDiv);
      });
    }
  };

  watch(state, 'formState', () => {
    const submitButton = document.querySelector('button[type="submit"]');
    if (state.formState === 'submitted') {
      urlInputField.value = '';
      feedback.classList.add('text-success');
      feedback.textContent = i18next.t('feedback.success');
      submitButton.removeAttribute('disabled');
    }
    if (state.formState === 'inactive') {
      submitButton.setAttribute('disabled', '');
    }
    if (state.formState === 'valid') {
      submitButton.removeAttribute('disabled');
      urlInputField.classList.remove('is-invalid');
    }
    if (state.formState === 'invalid') {
      submitButton.setAttribute('disabled', '');
      urlInputField.classList.add('is-invalid');
    }
  });

  watch(state, 'errors', () => {
    renderErrors();
  });

  watch(state, 'feeds', () => {
    renderFeedDisplay();
  });

  watch(state, 'posts', () => {
    renderStreamDisplay();
  });

  urlInputField.addEventListener('input', () => {
    state.errors = [];
    const formData = Object.fromEntries(new FormData(feedInputForm));
    try {
      schema.validateSync(formData, { abortEarly: false });
      state.formState = 'valid';
    } catch (errors) {
      state.formState = 'invalid';
      errors.inner.forEach((error) => {
        console.log(error.message);
        state.errors.push(error.message);
      });
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
