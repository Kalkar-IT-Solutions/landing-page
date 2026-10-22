// The contact form writes a mail and hands it to the visitor's mail app.
// Without this script the form posts to mailto: itself (text/plain).
document.querySelectorAll('form[data-kit-mail]').forEach(function (form) {
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
  });
});
