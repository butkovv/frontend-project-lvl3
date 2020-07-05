import { watch } from 'melanke-watchjs';
import i18next from 'i18next';
import resources from './locales';

export default (state) => {
  i18next.init({
    lng: 'en',
    debug: true,
    resources,
  });
  const mainContainer = document.querySelector('.container');
  const outputRow = document.createElement('div');
  outputRow.classList.add('row', 'ml-1');
  outputRow.innerHTML = '<div class="col" id="feeds"></div><div class="col" id="stream"></div>';
  mainContainer.appendChild(outputRow);

  const urlInputField = document.querySelector('.form-control');
  const feedback = document.querySelector('.feedback');
  const feedsDisplay = document.querySelector('#feeds');
  const streamDisplay = document.querySelector('#stream');
  const submitButton = document.querySelector('.btn-primary');

  const renderFeedDisplay = () => {
    const feeds = state.feeds.map((feed) => `<div class="row">${feed.title} — ${feed.description}</div>`);
    feedsDisplay.innerHTML = feeds.join('');
  };

  const renderStreamDisplay = () => {
    const posts = state.posts.map((post) => `<div class="row"><a href='${post.link}'>${post.title}</a></div>`);
    streamDisplay.innerHTML = posts.join('');
  };

  const renderErrors = () => {
    const errors = state.errors.map((error) => `<div class="text-danger">${error}</div>`);
    feedback.innerHTML = errors.join('');
  };

  const renderInputForm = () => {
    switch (state.formState) {
      case 'initial':
        submitButton.setAttribute('disabled', '');
        break;
      case 'submitted':
        urlInputField.value = '';
        feedback.classList.add('text-success');
        feedback.textContent = i18next.t('feedback.success');
        submitButton.removeAttribute('disabled');
        urlInputField.removeAttribute('disabled');
        break;
      case 'inactive':
        submitButton.setAttribute('disabled', '');
        urlInputField.setAttribute('disabled', '');
        break;
      case 'valid':
        submitButton.removeAttribute('disabled');
        urlInputField.classList.remove('is-invalid');
        break;
      case 'invalid':
        submitButton.setAttribute('disabled', '');
        urlInputField.classList.add('is-invalid');
        break;
      default:
        throw new Error(`${i18next.t('errors.unknownState')}${state.formState}`);
    }
  };

  watch(state, 'formState', renderInputForm);

  watch(state, 'errors', renderErrors);

  watch(state, 'feeds', renderFeedDisplay);

  watch(state, 'posts', renderStreamDisplay);
};
