import { watch } from 'melanke-watchjs';
import * as yup from 'yup';
import i18next from 'i18next';
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
    validationState: 'valid',
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
    const newFeed = {
      id: state.currentFeedID,
      url,
      title,
      description,
    };
    state.feeds = [...state.feeds, newFeed];

    const items = data.querySelectorAll('item');
    items.forEach((item) => {
      const itemTitle = item.querySelector('title').textContent;
      const itemLink = item.querySelector('link').textContent;
      const newPost = {
        postId: state.currentPostId,
        feedId: state.currentFeedID,
        title: itemTitle,
        link: itemLink,
      };
      state.posts = [...state.posts, newPost];
    });
    state.currentFeedID += 1;
    urlInputField.value = '';
    feedback.classList.add('text-success');
    feedback.textContent = i18next.t('feedback.success');
  };


  const submitNewURL = (url) => {
    state.validationState = 'inactive';
    fetch(`${proxyURL}${url}`)
      .then((response) => response.text())
      .then((str) => parseRSS(str))
      .then((data) => addNewFeed(url, data))
      .catch((error) => { state.errors = [...state.errors, error]; })
      .then(() => { state.validationState = 'valid'; });
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
    state.posts.forEach((post) => {
      const postDiv = document.createElement('div');
      postDiv.classList.add('row');
      postDiv.innerHTML = `<a href='${post.link}'>${post.title}</a>`;
      streamDisplay.prepend(postDiv);
    });
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

  watch(state, 'validationState', () => {
    const submitButton = document.querySelector('button[type="submit"]');
    if (state.validationState === 'inactive') {
      submitButton.setAttribute('disabled', '');
    }
    if (state.validationState === 'valid') {
      submitButton.removeAttribute('disabled');
      urlInputField.classList.remove('is-invalid');
    }
    if (state.validationState === 'invalid') {
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
      state.validationState = 'valid';
    } catch (errors) {
      state.validationState = 'invalid';
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
    }
  });
};
