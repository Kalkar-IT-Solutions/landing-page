// The contact form sends to Redaktion's contact add-on and shows the answer
// in the form. Form data and Accept are "simple" for CORS: no preflight.
// Without this script the browser posts the form itself and the server sends
// it back to the page with #kontakt-ok or #kontakt-fehler, and the hero's
// button is a plain mailto link. The partials may include this file more
// than once on a page, so every element is wired only once.
document.querySelectorAll('form[data-kit-contact]:not([data-kit-ready])').forEach(function (form) {
  form.setAttribute('data-kit-ready', '');
  var shown = Date.now();
  var status = form.querySelector('.kit-form-status');
  var button = form.querySelector('button[type=submit]');
  function show(text, failed) {
    status.textContent = text;
    status.hidden = false;
    status.classList.toggle('kit-form-status--error', failed);
  }
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    if (!form.reportValidity()) return;
    // How long the form was open; the server takes less than 3 s for a bot.
    form.elements.t.value = String(Date.now() - shown);
    button.disabled = true;
    fetch(form.action, {
      method: 'POST',
      body: new URLSearchParams(new FormData(form)),
      headers: { Accept: 'application/json' }
    }).then(function (response) {
      if (response.ok) {
        form.reset();
        shown = Date.now();
        show(form.dataset.kitOk, false);
      } else {
        show(response.status === 429 ? form.dataset.kitRate : form.dataset.kitError, true);
      }
    }).catch(function () {
      show(form.dataset.kitOffline, true);
    }).then(function () {
      button.disabled = false;
    });
  });
});

// A link with data-kit-dialog opens the dialog of that id instead of
// following its href. The close button, Escape and a click on the backdrop
// close it.
document.querySelectorAll('a[data-kit-dialog]:not([data-kit-ready])').forEach(function (link) {
  var dialog = document.getElementById(link.dataset.kitDialog);
  if (!dialog || typeof dialog.showModal !== 'function') return;
  link.setAttribute('data-kit-ready', '');
  link.setAttribute('aria-haspopup', 'dialog');
  link.addEventListener('click', function (event) {
    event.preventDefault();
    dialog.showModal();
    var first = dialog.querySelector('input, textarea');
    if (first) first.focus();
  });
  dialog.querySelectorAll('[data-kit-close]').forEach(function (button) {
    button.addEventListener('click', function () { dialog.close(); });
  });
  // A click on the dialog element itself is either its padding or the
  // backdrop; only outside its box does it close.
  dialog.addEventListener('click', function (event) {
    if (event.target !== dialog) return;
    var box = dialog.getBoundingClientRect();
    var inside = event.clientX >= box.left && event.clientX <= box.right &&
      event.clientY >= box.top && event.clientY <= box.bottom;
    if (!inside) dialog.close();
  });
});
