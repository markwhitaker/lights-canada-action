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
                    tip.text(`${film.state}: ${film.title} (${film.year})`);
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
                style: `background-color: ${film.colour}`
            })
            .text(buttonType.getCaption(film))
            .click(() => showFilmDetails(film.stateCode))
            .prepend($("<img/>")
                .prop({
                    src: film.flag,
                    alt: flagAltText(film)
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
        return `${film.title} (${film.year})`;
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
                alt: flagAltText(film)
            });

        $("#filmImageContainer")
            .toggleClass("defaultImage", !film.image);
        $("#filmImage")
            .prop({
                src: film.image,
                alt: `Movie poster for ${film.title} (${film.year})`
            })
            .toggle(!!film.image);

        $("#filmOriginalTitle")
            .text(film.originalTitle)
            .toggle(!!film.originalTitle);

        $("#imdbLink").toggle(!!film.imdb).prop({href: `https://www.imdb.com/title/${film.imdb}/`});
        $("#letterboxdLink").toggle(!!film.letterboxd).prop({href: `https://letterboxd.com/film/${film.letterboxd}/`});
        $("#rottenTomatoesLink").toggle(!!film.rottenTomatoes).prop({href: `https://www.rottentomatoes.com/m/${film.rottenTomatoes}`});
        $("#wikipediaLink").toggle(!!film.wikipedia).prop({href: `https://en.wikipedia.org/wiki/${film.wikipedia}`});
        $("#justwatchLink").toggle(!!film.justwatch).prop({href: `https://www.justwatch.com/uk/movie/${film.justwatch}`});
        $("#trailerLink").toggle(!!film.trailer).prop({href: `https://youtu.be/${film.trailer}`});
        $("#reviewLink").toggle(!!film.review).prop({href: `https://youtu.be/${film.review}`});

        $("#filmReviewer")
            .text(film.reviewer);

        $(".modal-header").css("background-color", film.colour);

        $("#filmDetailsModal").modal();
    }

    function flagAltText(film) {
        return `Flag of ${film.state}`;
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
