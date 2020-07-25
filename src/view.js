import { watch } from 'melanke-watchjs';
import i18next from 'i18next';
import resources from './locales';

export default (state) => {
  const urlInputField = document.querySelector('.form-control');
  const feedback = document.querySelector('.feedback');
  const feedsDisplay = document.querySelector('.feeds');
  const streamDisplay = document.querySelector('.stream');
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

  const highlightValidation = () => i18next.init({
    lng: 'en',
    debug: true,
    resources,
  }).then((t) => {
    switch (state.inputState) {
      case 'blank':
        submitButton.setAttribute('disabled', '');
        urlInputField.classList.remove('is-invalid');
        break;
      case 'invalid':
        submitButton.setAttribute('disabled', '');
        urlInputField.removeAttribute('disabled');
        urlInputField.classList.add('is-invalid');
        break;
      case 'valid':
        submitButton.removeAttribute('disabled');
        urlInputField.classList.remove('is-invalid');
        break;
      default:
        throw new Error(`${t('errors.unknownState')}${state.inputState}`);
    }
  });

  const displaySubmissionState = () => i18next.init({
    lng: 'en',
    debug: true,
    resources,
  }).then((t) => {
    switch (state.submissionState) {
      case 'submitting':
        submitButton.setAttribute('disabled', '');
        urlInputField.setAttribute('disabled', '');
        break;
      case 'submitted':
        urlInputField.value = '';
        feedback.classList.add('text-success');
        feedback.textContent = i18next.t('feedback.success');
        urlInputField.removeAttribute('disabled');
        break;
      case 'submissionFailed':
        urlInputField.removeAttribute('disabled');
        submitButton.removeAttribute('disabled');
        break;
      default:
        throw new Error(`${t('errors.unknownState')}${state.submissionState}`);
    }
  });

  watch(state, 'inputState', highlightValidation);

  watch(state, 'submissionState', displaySubmissionState);

  watch(state, 'errors', renderErrors);

  watch(state, 'feeds', renderFeedDisplay);

  watch(state, 'posts', renderStreamDisplay);
};
