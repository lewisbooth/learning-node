import axios from 'axios';
import dompurify from 'dompurify';

function searchResultsHTML (stores) {
  return stores.map(store => {
    return `
      <a href = "/store/${store.slug}" class="search__result">
        <strong>${store.name}</strong>
      </a>
    `
  }).join('');
}

function typeAhead(search) {
  if (!search) return;

  const searchInput = search.querySelector('input[name="search"');
  const searchResults = search.querySelector('.search__results');
  
  searchInput.on('input', function() {
    if (!this.value) {
      searchResults.style.display = 'none';
      return;
    }

    searchResults.style.display = 'block';
    axios
      .get(`/api/search?q=${this.value}`)
      .then(res => {
        if (res.data.length) {
          dompurify.sanitize(
            searchResults.innerHTML = searchResultsHTML(res.data)
          );
        } else {
          dompurify.sanitize(
            searchResults.innerHTML = `<div class="search__result">There were no results for ${this.value}</div>`
          );
        }
      })
      .catch(err => {
        console.log(err);
      });
  });

  // Handle keyboard inputs
  searchInput.on('keydown', (e) => {
    if (![38, 40, 13].includes(e.keyCode)) { return; }

    const resultList = document.querySelectorAll('.search__result');
    let selectedIndex = resultList.findIndex((item) => {
      return item.classList.contains('search__result--active')
    });

    function selectResult(index) {
      resultList.forEach((result) => {
        result.classList.remove('search__result--active');
      });
      resultList[index].classList.add('search__result--active');
    }

    switch (e.keyCode) {
      // Up arrow
      case 38: {
        if (selectedIndex > 0) {
          selectedIndex--;
        } else {
          selectedIndex = resultList.length - 1;
        }
        selectResult(selectedIndex);
        break;
      }
      // Down arrow
      case 40: {
        if (selectedIndex < resultList.length - 1) {
          selectedIndex++;
        } else {
          selectedIndex = 0;
        }
        selectResult(selectedIndex);
        break;
      }
      // Enter
      case 13: {
        window.location = resultList[selectedIndex].href;
        break;
      }
    }

  });
}  

export default typeAhead;