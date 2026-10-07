// Update star counts from GitHub. The numbers in the page are the fallback.
(function () {
  var KEY = 'gh-stars';
  var TTL = 3600000;

  function render(stars) {
    document.querySelectorAll('[data-repo]').forEach(function (el) {
      var n = stars[el.dataset.repo];
      if (n != null) el.textContent = n.toLocaleString();
    });
  }

  try {
    var cached = JSON.parse(localStorage.getItem(KEY));
    if (cached && Date.now() - cached.t < TTL) return render(cached.stars);
  } catch (e) {}

  fetch('https://api.github.com/users/sirrobot01/repos?per_page=100')
    .then(function (res) {
      if (!res.ok) throw res;
      return res.json();
    })
    .then(function (repos) {
      var stars = {};
      repos.forEach(function (repo) {
        stars[repo.name] = repo.stargazers_count;
      });
      render(stars);
      try {
        localStorage.setItem(KEY, JSON.stringify({ t: Date.now(), stars: stars }));
      } catch (e) {}
    })
    .catch(function () {});
})();

// Perseverance landed 2021-02-18 20:55 UTC at about 15:53 local mean solar time on sol 0.
(function () {
  var sol = Math.floor((Date.now() - Date.UTC(2021, 1, 18, 20, 55)) / 88775244 + 0.662);
  document.getElementById('sol').textContent = 'Sol ' + sol.toLocaleString('en-US');
})();

// Print every role, not only the open one.
addEventListener('beforeprint', function () {
  document.querySelectorAll('details').forEach(function (d) {
    d.removeAttribute('name');
    d.open = true;
  });
});
