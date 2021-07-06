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
   * @return { Promise }
   */
  _initBrowser: async function () {
    return new Promise(async resolve => {
      /**
       * @const { Promise } browser New browser instance
       */
      const browser = await this._puppeteer.launch({ headless: false });
      return resolve(browser);
    });
  },
  /**
   * Page instance to be used throughout the app
   * @private
   * @return { Promise }
   */
  _initPage: async function (BROWSER) {
    return new Promise(async resolve => {
      /**
       * @const { Promise } page New page instance
       */
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
  _createSearchTermDirectory: function (SEARCH_TERM, PARENT_DIRECTORY = ".") {
    /**
     * @const { string } _name Directory name
     */
    const _name = SEARCH_TERM.replace(/[/\\:*'"<>|.?]/g, "_");
    /**
     * @const { Date } _date Current datetime
     */
    const _date = new Date();
    /**
     * @const { string } _directory Directory path
     */
    const _directory = `${PARENT_DIRECTORY}/${_name}-${_date.getDate()}-${_date.getMonth()}-${_date.getFullYear()}__${_date.getHours()}-${_date.getMinutes()}-${_date.getSeconds()}`;
    this._fs.mkdir(_directory, _ERROR => {
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
   * @return { void }
   */
  _createSourceFile: function (
    PAGE,
    PARENT_DIRECTORY,
    CONTENT,
    FORMAT = "json"
  ) {
    /**
     * @const { string } _name File name
     */
    const _name = `page-${PAGE}`;
    /**
     * @const { string } _path Output file path
     */
    const _path = `${PARENT_DIRECTORY}/${_name}`;
    this._fs.writeFileSync(`${_path}.${FORMAT}`, CONTENT, _ERROR => {
      if (_ERROR) {
        throw new Error(this._errors.CREATING_FILE(_ERROR, _path));
      }
    });
  },
  /**
   * Function to store all links in a file for safekeeping
   * @private
   * @param { string } SEARCH_TERM
   * @param { string[] } LINKS
   * @param { string } PARENT_DIRECTORY
   * @param { string } FORMAT
   * @return { void }
   */
  _createLinksFile: function (
    SEARCH_TERM,
    CONTENT,
    PARENT_DIRECTORY,
    FORMAT = "json"
  ) {
    /**
     * @const { string } _name File name
     */
    const _name = `${SEARCH_TERM}`;
    /**
     * @const { string } _path Output file path
     */
    const _path = `${PARENT_DIRECTORY}/${_name}`;
    this._fs.writeFileSync(
      `${_path}.${FORMAT}`,
      JSON.stringify(CONTENT),
      _ERROR => {
        if (_ERROR) {
          throw new Error(this._errors.CREATING_FILE(_ERROR, _path));
        }
      }
    );
  },
  /**
   * Function to store each product's data inside its own file
   * @param { Object } CONTENT
   * @param { string } PARENT_DIRECTORY
   * @param { string } FORMAT
   */
  _createProductFile: function (CONTENT, PARENT_DIRECTORY, FORMAT = "json") {
    /**
     * @const { Date } _date Current datetime
     */
    const _date = new Date();
    /**
     * @const { string } _name File name
     */
    const _name = `${_date.getDate()}-${_date.getMonth()}-${_date.getFullYear()}__${_date.getHours()}-${_date.getMinutes()}-${_date.getSeconds()}`;
    /**
     * @const { string } _path Output file path
     */
    const _path = `${PARENT_DIRECTORY}/${_name}`;
    this._fs.writeFileSync(
      `${_path}.${FORMAT}`,
      JSON.stringify(CONTENT),
      _ERROR => {
        if (_ERROR) {
          throw new Error(this._errors.CREATING_FILE(_ERROR, _path));
        }
      }
    );
  },
  /**
   * Function to create a data object from the DOM that gets utilized for\
   * file creation and recursion
   * @param { number } PAGE
   * @return { { source: string, next: boolean } }
   */
  _getSearchSource: async function (PAGE) {
    return await PAGE.evaluate(async () => {
      return await new Promise(async resolve => {
        setTimeout(() => {
          /**
           * @const { { source: string, next: boolean } } _data
           */
          _data = {
            source: document.querySelector(".c1_t2i").innerHTML,
            next: document.querySelector('li[title="Next Page"]') ? true : false
          };
          resolve(_data);
        });
      });
    });
  },
  /**
   * Function to create an array of links from the DOM that gets utilized for\
   * file creation and recursion
   * @private
   * @param { number } PAGE
   * @return { { links: string[], count: number, next: boolean } }
   */
  _getProductLinks: async function (PAGE) {
    return await PAGE.evaluate(async () => {
      return await new Promise(async resolve => {
        /**
         * @const { string } _selector Queryselector for links on product cards on a page
         */
        const _selector = ".cRjKsc a";
        /**
         * @const { Node[] } _products All products found in the DOM
         */
        const _products = document.querySelectorAll(_selector);
        /**
         * @const { { links: string[], count: number, next: boolean } } _data
         */
        const _data = {
          links: Array.from(_products).map(_link => _link.href),
          count: _products.length,
          next: document.querySelector('li[title="Next Page"]') ? true : false
        };
        resolve(_data);
      });
    });
  },
  _getProductData: async function (PAGE) {
    return await PAGE.evaluate(async () => {
      return await new Promise(async resolve => {
        /**
         * @const { string } _selector Query selector for DOM node that contains all of the product's major JSON data
         */
        const _selector = "[type='application/ld+json']";
        /**
         * @const { Object } _jsonResponse
         */
        _jsonResponse = JSON.parse(document.querySelector(_selector).innerText);
        resolve(_jsonResponse);
      });
    });
  },
  /**
   * URL Encode search term
   * @param { string } SEARCH_TERM
   */
  _urlEncodeSearchTerm: function (SEARCH_TERM) {
    return SEARCH_TERM.replace(/ /g, "%20");
  },
  /**
   * Run the functions of this object to scrap data
   *
   * @public
   * @param { string|string[] } SEARCH_TERMS
   * @return { void }
   */
  run: async function (SEARCH_TERMS) {
    const _browser = await this._initBrowser();
    const _page = await this._initPage(_browser);
    const _searchTerms = Array.isArray(SEARCH_TERMS)
      ? SEARCH_TERMS.map(_searchTerm => this._urlEncodeSearchTerm(_searchTerm))
      : this._urlEncodeSearchTerm(SEARCH_TERM);
    for (const _searchTerm of _searchTerms) {
      /**
       * @var { boolean } _nextPage
       * @var { number } _currentPage
       * @var { string[] } _links
       */
      let _nextPage, _currentPage, _outputDirectory;
      _currentPage = 1;
      _nextPage = true;
      _links = [];
      _outputDirectory = this._createSearchTermDirectory(_searchTerm);
      /**
       * @todo Add error handling to take the abrupt "No results found" page
       * and continue the loop. This would be done by creating a statement that
       * checks to see if any products exist on the page. If none exist, then the
       * previous page should not have had a next page link in it, so it should be
       * considered an error. For safety, this error handling could also have a delay
       * before spinning up again, for 5 seconds or so.
       */
      while (_nextPage) {
        await _page.goto(
          `https://www.daraz.pk/catalog/?page=${_currentPage}&q=${_searchTerm}&sort=pricedesc`
        );
        console.log(
          `Navigated to Search Result #${_currentPage} :: https://www.daraz.pk/catalog/?page=${_currentPage}&q=${_searchTerm}&sort=pricedesc`
        );
        const _extractedData = await this._getProductLinks(_page);
        _extractedData.links = _extractedData.links.filter(
          _link => !_links.includes(_link)
        );
        _links = [..._links, ..._extractedData.links];
        this._createLinksFile(_searchTerm, _links, _outputDirectory);
        _nextPage = _extractedData.next;
        if (_nextPage) {
          _currentPage++;
        } else {
          break;
        }
      }
      for (const _link of _links) {
        await _page.goto(_link);
        console.log(`Navigated to Product :: ${_link}`);
        const _productData = await this._getProductData(_page);
        this._createProductFile(_productData, _outputDirectory);
      }
    }
    _browser.close();
  }
};
