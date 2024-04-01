"use strict";

$(function () {
    const MAP_BACKGROUND_COLOUR = "#F0F0F0";
    const INACTIVE_MAP_COLOUR = "#D0D0D0";
    const ACTIVE_MAP_COLOURS = [
        "#FF0000",
        "#F00000",
        "#E00000",
        "#D10000",
        "#C20000"
    ];
    const ALT_TEXT_FLAG = "Flag of {0}";
    const ALT_TEXT_POSTER = "Film poster for {0}";
    const URL_IMDB = "https://www.imdb.com/title/{0}/";
    const URL_JUST_WATCH = "https://www.justwatch.com/uk/movie/{0}";
    const URL_LETTERBOXD = "https://letterboxd.com/film/{0}/";
    const URL_ROTTEN_TOMATOES = "https://www.rottentomatoes.com/m/{0}";
    const URL_WIKIPEDIA = "https://en.wikipedia.org/wiki/{0}";
    const URL_YOUTUBE = "https://www.youtube.com/watch?v={0}";

    const BUTTON_TYPE = Object.freeze({
        TITLE: {
            getCaption: getFilmTitleAndYear,
            getTip: getFilmState
        },
        STATE: {
            getCaption: getFilmState,
            getTip: getFilmTitleAndYear
        }
    });

    const SORT_FUNCTION = Object.freeze({
        TITLE: film => film.title.sortable(),
        TITLE_LENGTH: film => film.title.length,
        STATE: film => film.state,
        YEAR: film => film.year
    });

    let _map;
    let _films = {};
    let _filmsSortedByState = [];
    let _filmsSortedByTitle = [];

    initialiseEventHandlers();

    loadData(() => {
        initialiseMap();
        initialiseStatesList();
        initialiseMoviesList();
    });

    //-----------------------------------------------------------

    function initialiseEventHandlers() {
        $("a").prop("target", "_blank");

        $("#btnShowMap").click(() => showMap());
        $("#btnShowListStates").click(() => showListStates());
        $("#btnShowListMovies").click(() => showListMovies());
        $("#btnShowAbout").click(() => showAbout());

        $('#filmStateFlag').on({
            error: function () {
                $(this).hide();
            },
            load: function () {
                $(this).show();
            }
        });
    }

    function loadData(onLoaded) {
        _filmsSortedByState = [];
        _filmsSortedByTitle = [];
        _films = {};

        $.getJSON("data/films.json", filmsArray => {
            filmsArray.forEach(film => {
                film.colour = getRandomActiveMapColour();
                _films[film.stateCode] = film;
            });
            _filmsSortedByState = filmsArray.sortBy(SORT_FUNCTION.STATE);
            _filmsSortedByTitle = filmsArray.slice().sortBy(SORT_FUNCTION.TITLE);

            onLoaded();
        });
    }

    function initialiseMap() {
        _map = new jvm.Map({
            map: "ca_lcc",
            container: $("#map"),
            backgroundColor: MAP_BACKGROUND_COLOUR,
            zoomMin: 0.9,
            focusOn: {
                x: 0.5,
                y: 0.5,
                scale: 0.95
            },
            series: {
                regions: [{
                    attribute: "fill"
                }]
            },
            onRegionClick: (_, stateCode) => showFilmDetails(stateCode),
            onRegionTipShow: (_, tip, code) => {
                let film = _films[code];
                if (film) {
                    tip.text("{0}: {1} ({2})".format(film.state, film.title, film.year));
                }
            }
        });

        // Set map colours
        _map.series.regions[0].setValues(getMapColours());
    }

    function uninitialiseMap() {
        if (_map) {
            _map.remove();
            _map = undefined;
        }
    }

    function initialiseStatesList() {
        initialiseList(
            "#listStates",
            _filmsSortedByState,
            BUTTON_TYPE.STATE);
    }

    function initialiseMoviesList() {
        initialiseList(
            "#listMovies",
            _filmsSortedByTitle,
            BUTTON_TYPE.TITLE);
    }

    function initialiseList(elementId, array, buttonType) {
        $(elementId).empty();
        array.forEach(film => $(elementId).append(buildMovieButton(film, buttonType)));
    }

    function buildMovieButton(film, buttonType) {
        return $("<span></span>")
            .addClass("filmButton")
            .prop({
                title: buttonType.getTip(film),
                style: "background-color: {0}".format(film.colour)
            })
            .text(buttonType.getCaption(film))
            .click(() => showFilmDetails(film.stateCode))
            .prepend($("<img/>")
                .prop({
                    src: film.flag,
                    alt: ALT_TEXT_FLAG.format(film.state)
                })
                .on("error", function () {
                    $(this).hide();
                })
            );
    }

    function getFilmState(film) {
        return film.state;
    }

    function getFilmTitleAndYear(film) {
        return "{0} ({1})".format(film.title, film.year);
    }

    function showMap() {
        selectButton("#btnShowMap");
        selectSection("#sectionMap");
        initialiseMap();
    }

    function showListStates() {
        selectButton("#btnShowListStates");
        selectSection("#sectionListStates");
        uninitialiseMap();
    }

    function showListMovies() {
        selectButton("#btnShowListMovies");
        selectSection("#sectionListMovies");
        uninitialiseMap();
    }

    function showAbout() {
        selectButton("#btnShowAbout");
        selectSection("#sectionAbout")
        uninitialiseMap();
    }

    function selectButton(selector) {
        $(selector)
            .addClass("selected")
            .siblings()
            .removeClass("selected");
    }

    function selectSection(selector) {
        $(selector)
            .show()
            .siblings()
            .hide();
    }

    function getMapColours() {
        let colours = {};
        for (let region in _map.regions) {
            colours[region] = _films[region]
                ? _films[region].colour
                : INACTIVE_MAP_COLOUR;
        }
        return colours;
    }

    function getRandomActiveMapColour() {
        let index = Math.floor(Math.random() * ACTIVE_MAP_COLOURS.length);
        return ACTIVE_MAP_COLOURS[index];
    }

    function showFilmDetails(stateCode) {
        let film = _films[stateCode];

        if (!film) {
            return;
        }

        $("#filmState").text(film.state);
        $("#filmTitle").text(film.title);
        $("#filmYear").text(film.year);
        $("#filmStateFlag")
            .prop({
                src: film.flag,
                alt: ALT_TEXT_FLAG.format(film.state)
            });

        $("#filmImageContainer")
            .toggleClass("defaultImage", !film.image);
        $("#filmImage")
            .prop({
                src: film.image,
                alt: ALT_TEXT_POSTER.format(film.title)
            })
            .toggle(!!film.image);

        $("#filmOriginalTitle")
            .text(film.originalTitle)
            .toggle(!!film.originalTitle);

        setupButton("#imdbLink", URL_IMDB, film.imdb);
        setupButton("#letterboxdLink", URL_LETTERBOXD, film.letterboxd);
        setupButton("#rottenTomatoesLink", URL_ROTTEN_TOMATOES, film.rottenTomatoes);
        setupButton("#wikipediaLink", URL_WIKIPEDIA, film.wikipedia);
        setupButton("#justwatchLink", URL_JUST_WATCH, film.justwatch);
        setupButton("#trailerLink", URL_YOUTUBE, film.trailer);
        setupButton("#reviewLink", URL_YOUTUBE, film.review);

        $("#filmReviewer")
            .text(film.reviewer);

        $(".modal-header").css("background-color", film.colour);

        $("#filmDetailsModal").modal();
    }

    function setupButton(selector, url, value) {
        $(selector)
            .prop({
                href: url.format(value)
            })
            .toggle(!!value);
    }

    String.prototype.format = function () {
        let formatted = this;
        for (let i = 0; i < arguments.length; i++) {
            formatted = formatted.replace("{" + i + "}", arguments[i]);
        }
        return formatted;
    }

    String.prototype.sortable = function () {
        return this.replace(/^(A|The) /, "");
    }

    Array.prototype.sortBy = function (sortFunction) {
        return this.sort(function (a, b) {
            return sortFunction(a) < sortFunction(b) ? -1 : sortFunction(a) > sortFunction(b) ? 1 : 0
        });
    }
});
