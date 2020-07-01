import { watch } from 'melanke-watchjs';
import i18next from 'i18next';
import resources from './locales';

export default (state) => {
  i18next.init({
    lng: 'en',
    debug: true,
    resources,
  });

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

  const renderInputForm = () => {
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
  };

  watch(state, 'formState', renderInputForm);

  watch(state, 'errors', renderErrors);

  watch(state, 'feeds', renderFeedDisplay);

  watch(state, 'posts', renderStreamDisplay);
};
