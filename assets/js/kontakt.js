// The contact form writes a mail and hands it to the visitor's mail app.
// Without this script the form posts to mailto: itself (text/plain) and the
// hero's button is a plain mailto link. The partials may include this file
// more than once on a page, so every element is wired only once.
document.querySelectorAll('form[data-kit-mail]:not([data-kit-ready])').forEach(function (form) {
  form.setAttribute('data-kit-ready', '');
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    if (!form.reportValidity()) return;
    var name = form.elements.Name.value.trim();
    var message = form.elements.Nachricht.value.trim();
    var subject = form.dataset.kitSubject + (name ? ' – ' + name : '');
    var body = message + '\n\n' + name;
    window.location.href = 'mailto:' + form.dataset.kitMail +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(body);
    var dialog = form.closest('dialog');
    if (dialog) dialog.close();
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
