import { watch } from 'melanke-watchjs';

export default (state, getText) => {
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
    const globalErrors = state.errors.map((error) => `<div class="text-danger">${error}</div>`);
    const formErrors = state.form.errors.map((error) => `<div class="text-danger">${error}</div>`);
    const output = [...globalErrors, ...formErrors];
    feedback.innerHTML = output.join('');
  };

  const highlightValidation = () => {
    switch (state.form.inputState) {
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
        throw new Error(`Unknown state: ${state.form.inputState}`);
    }
  };

  const displaySubmissionState = () => {
    switch (state.form.submissionState) {
      case 'awaiting':
        break;
      case 'submitting':
        submitButton.setAttribute('disabled', '');
        urlInputField.setAttribute('disabled', '');
        break;
      case 'submitted':
        urlInputField.value = '';
        feedback.classList.add('text-success');
        feedback.textContent = getText('feedback.success');
        urlInputField.removeAttribute('disabled');
        break;
      case 'submissionFailed':
        urlInputField.removeAttribute('disabled');
        submitButton.removeAttribute('disabled');
        break;
      default:
        throw new Error(`Unknown state: ${state.form.submissionState}`);
    }
  };

  watch(state.form, 'inputState', highlightValidation);

  watch(state.form, 'submissionState', displaySubmissionState);

  watch(state, ['errors', 'form.errors'], renderErrors);

  watch(state, 'feeds', renderFeedDisplay);

  watch(state, 'posts', renderStreamDisplay);
};
