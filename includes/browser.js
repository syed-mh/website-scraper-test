/**
 * Object responsible for browser actvities
 *
 * @author Syed Mohammed Hassan <mohammad.hassan@va8ivedigital.com>
 */
module.exports = {
  /**
   * @const { Module } _puppeteer
   * @private
   */
  _puppeteer: require("puppeteer"),
  /**
   * @const { Module } _fs
   * @private
   */
  _fs: require("fs"),
  /**
   * Error string constants
   * @const { Object } _errors
   */
  _errors: require("./utilities/errors"),
  /**
   * Browser instance to be used throughout the app
   * @private
   */
  _initBrowser: async function () {
    return new Promise(async (resolve) => {
      const browser = await this._puppeteer.launch({ headless: false });
      return resolve(browser);
    });
  },
  /**
   * Page instance to be used throughout the app
   * @private
   */
  _initPage: async function (BROWSER) {
    return new Promise(async (resolve) => {
      const page = await BROWSER.newPage();
      return resolve(page);
    });
  },
  /**
   * Function to create a directory for a search term
   * @private
   * @param { string } SEARCH_TERM
   * @param { string } PARENT_DIRECTORY
   * @return { string } Directory path
   */
  _createSearchTermlDirectory: function (SEARCH_TERM, PARENT_DIRECTORY) {
    const _name = SEARCH_TERM.replace(/[/\\:*'"<>|.?]/g, "_");
    const _directory = `${PARENT_DIRECTORY}/${_name}`;
    this._fs.mkdir(_directory, (_ERROR) => {
      if (_ERROR) {
        throw new Error(
          this._errors.CREATING_DIRECTORY(_ERROR, `./${_directory}/`)
        );
      }
    });
    return `${_directory}/`;
  },
  /**
   * Function to create a file with a URL's source code
   * @private
   * @param { number } PAGE
   * @param { string } PARENT_DIRECTORY
   */
  _createSourceFile: function (PAGE, PARENT_DIRECTORY, CONTENT) {
    const _name = `page-${PAGE}`;
    const _path = `${PARENT_DIRECTORY}/${_name}`;
    this._fs.writeFileSync(`${_path}.html`, CONTENT, (_ERROR) => {
      if (_ERROR) {
        throw new Error(this._errors.CREATING_FILE(_ERROR, _path));
      }
    });
  },
  /**
   * Function to create a data object from the DOM that gets utilized for\
   * file creation and recursion
   * @param { number } PAGE
   * @returns { { source: string, next: boolean } }
   */
  _getData: async function (PAGE) {
    return await PAGE.evaluate(async () => {
      return await new Promise(async (resolve) => {
        setTimeout(() => {
          _data = {
            source: document.querySelector(".c1_t2i").innerHTML,
            next: document.querySelector('li[title="Next Page"]')
              ? true
              : false,
          };
          resolve(_data);
        });
      });
    });
  },
  /**
   * Run the functions of this object to scrap data
   *
   * @todo Add error handling to take the abrupt "No results found" page
   * and continue the loop. This would be done by creating a statement that
   * checks to see if any products exist on the page. If none exist, then the
   * previous page should not have had a next page link in it, so it should be
   * considered an error. For safety, this error handling could also have a delay
   * before spinning up again, for 5 seconds or so.
   */
  run: async function (SEARCH_TERMS) {
    const _browser = await this._initBrowser();
    const _page = await this._initPage(_browser);
    const _searchTerms = SEARCH_TERMS.map((_searchTerm) =>
      _searchTerm.replace(/ /g, "%20")
    );
    for (const _searchTerm of _searchTerms) {
      let _nextPage, _currentPage;
      _currentPage = 1;
      _nextPage = true;
      const _directory = this._createSearchTermlDirectory(_searchTerm, ".");
      while (_nextPage) {
        await _page.goto(
          `https://www.daraz.pk/catalog/?page=${_currentPage}&q=${_searchTerm}&sort=pricedesc`
        );
        console.log(
          `https://www.daraz.pk/catalog/?page=${_currentPage}&q=${_searchTerm}&sort=pricedesc`
        );
        const _data = await this._getData(_page);
        this._createSourceFile(_currentPage, _directory, _data.source);
        if (_data.next) {
          _currentPage++;
        } else {
          _nextPage = false;
        }
      }
    }
    _browser.close();
  },
};
