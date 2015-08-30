// Get the elements:
var iframe          = document.getElementById('iframe');
var url             = document.getElementById("url");
var reloadButton    = document.getElementById("reload");
var bookmarksButton = document.getElementById("bookmarks");
var bookmarksPopup  = document.getElementById("bookmarks-popup");
var addBookmark    =  document.getElementById("add-bookmark");

// Other variables:
var wpb; //web panel bookmarks

chrome.storage.local.get('lastSite', function(object) {
  if ( typeof object.lastSite == "undefined") {
    chrome.storage.local.set({'lastSite': 'example.com'});
    url.value = "example.com";
    changeUrl();
  } else {
    url.value = object.lastSite;
    changeUrl();
  }
});

function changeUrl() {
  if (url.value.substring(0, 7) === "http://") {
    iframe.src = url.value;
    url.value = url.value.substr(7);
  } else if (url.value.substring(0, 8) === "https://") {
    iframe.src = url.value;
    url.value = url.value.substr(8);
  } else {
    iframe.src = "http://" + url.value;
  }
  chrome.storage.local.set({'lastSite': url.value});
}

reloadButton.onclick = function() {
	changeUrl();
}

url.onkeypress = function(e){
  if (e.keyCode == '13'){
    changeUrl();
    return false;
  }
}

addBookmark.onclick = function createBookmark() {
  if (url.value != "") {
    var title = prompt("Bookmark title:", url.value);
    if (title == "") {
      alert("Please type a title for the bookmark. Press cancel on the next pop-up to escape.");
      createBookmark();
    } else if (title != null) {
      changeUrl();
      chrome.bookmarks.create({'parentId': wpb, 'url': iframe.src, 'title': title});
      loadBookmarks();
    }
  } else {
    alert("You haven't entered a url.");
  }
}

chrome.bookmarks.search("Web Panel extension", function(list) {
  if (typeof list[0] == "undefined") {
    chrome.bookmarks.create({'title': 'Web Panel extension'}, function(folder) {
      wpb = folder.id;
      loadBookmarks();
    });
  } else {
    chrome.bookmarks.get(list[0].parentId, function(parent) {
      if (parent[0].title == "Trash") {
        chrome.bookmarks.create({'title': 'Web Panel extension'}, function(folder) {
          wpb = folder.id;
          loadBookmarks();
        });
      } else {
        wpb = list[0].id;
        loadBookmarks();
      }
    });
  }
});

function loadBookmarks() {
  var bookmarksId = [];
  chrome.bookmarks.getChildren(wpb, function(result) {
    var content = "";
    result.forEach(function(entry) {
      if (typeof entry.url == "undefined") {
        return;
      }
      var re = /(<([^>]+)>)/ig;
      entry.title = entry.title.replace(re, "");
      entry.url = entry.url.replace(re, "");

      content += '<div extension="test" title="' + entry.url + '" class="box">';
      content += '<img class="favicon-img" src="http://www.google.com/s2/favicons?domain=' + entry.url + '"></img>';
      content += '<div class="text-box"><p class="link">' + entry.title + '</p></div>';
      content += '</div>';
      bookmarksId.push(entry.id);
    });
    bookmarksPopup.innerHTML = content;

    var links = document.getElementsByClassName("box");
    for (var i = 0; i < links.length; i++) {
      (function() {
        var link = links[i].title;
        var thisNumber = i;
        links[i].oncontextmenu = function(e) {
          e.preventDefault();
          chrome.bookmarks.remove(bookmarksId[thisNumber], function() {
            loadBookmarks();
          });
        }
        links[i].onclick = function(e) {
          if (e.button == 0) {
            url.value = link;
            changeUrl();
            fadeOut();
          }
        }
      })();
    }
  });
}

var bookmarksPopupClosed = true;
bookmarksButton.onclick = function() {
  if (bookmarksPopupClosed) {
    fadeIn();
  } else {
    fadeOut();
  }
}

function fadeIn() {
  bookmarksPopup.style.display = "block";
  var animateIn = function() {
    bookmarksPopup.style.opacity = +bookmarksPopup.style.opacity + 0.20;
    if (+bookmarksPopup.style.opacity < 1) {
      requestAnimationFrame(animateIn);
    }
  }
  requestAnimationFrame(animateIn);
  bookmarksPopupClosed = false;
}

function fadeOut() {
  var animateOut = function() {
    bookmarksPopup.style.opacity = +bookmarksPopup.style.opacity - 0.20;
    if (+bookmarksPopup.style.opacity > 0) {
      requestAnimationFrame(animateOut);
    } else {
      bookmarksPopup.style.display = "none";
    }
  }
  requestAnimationFrame(animateOut);
  bookmarksPopupClosed = true;
}
