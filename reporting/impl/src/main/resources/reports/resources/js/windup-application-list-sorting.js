$(document).ready(function () {
    /**
     * All filtering related code
     **/
    function filtering() {
        var resultsToolbar = $('.toolbar-pf-results');
        var countResults = $('#count-results');
        var activeFilters = $('#active-filters');
        var filterInput = $('#filter');
        var filterDiv = $('#filter-div');
        var filterOptionsList = filterDiv.find('ul.dropdown-menu').first();
        var filterByLabel = $('.filter-by, #filter-by'); // $('.filter-by');
        var clearFiltersButton = $('#clear-filters');
        var filterTypeDiv = $('#filter-type');

        /** Active filters */
        var filters = [];

        var hasItemInArrayCallback = function(element, filterOption) {
            var filteringData = $(element).data('filtering');

            if (!filteringData || !filteringData.hasOwnProperty('tags') || filteringData.tags.length === 0) {
                return false;
            }

            return filteringData.tags.indexOf(filterOption.data) !== -1;
        };

        var checkNameMatchCallback = function(element, filterOption) {
            var name = $(element).data('name');
            var regex = new RegExp(filterOption.data, 'i');

            return name.match(regex) !== null;
        };

        /** Available filter options */
        var filterOptions = [
            { name: 'Name', value: 'name', data: '', callback:  checkNameMatchCallback },
            { name: 'Tags', value: 'tags', callback: hasItemInArrayCallback, data: '' }
        ];

        var andReducer = function(prev, curr) { return prev && curr; };
        var orReducer  = function(prev, curr) { return prev || curr; };

        var filterTypes = [
            { name: 'Matches all filters (AND)', reducer: andReducer, default: true },
            { name: 'Matches any filter (OR)',  reducer: orReducer,  default: false }
        ];


        /** Currently selected filter option */
        var currentFilterConfiguration = {
            filterBy: filterOptions[0],
            type: filterTypes[0]
        };

        function initialize() {
            $('div.real div.appInfo').each(function () {
                var tags = $(this).find('div.techs span.label').map(function() {
                    return $(this).text().trim();
                }).toArray();

                var filtering = {
                    tags: tags
                };

                $(this).data('filtering', filtering);
            });

            filterOptions.forEach(function(option) {
                filterOptionsList.append(makeFilterOptionListItem(option));
            });

            filterByLabel.text(currentFilterConfiguration.filterBy.name);

            makeTagsClickable();

            /**
             * Event handler for <enter> on filter-by input
             */
            $('#filter-form').on('submit', function(e) {
                e.preventDefault();
                var filterValue = filterInput.val().trim();
                addFilter(filterValue, currentFilterConfiguration.filterBy);
                filterInput.val('');
            });

            /** Event handler for clear filters action */
            clearFiltersButton.on('click', function() {
                filters = [];
                filterData();
            });

            /** Use first item from list for filtering */
            filterOptionsList.find('li a').first().click();

            filterTypes.forEach(function(filterType) {
                filterTypeDiv.find('ul.dropdown-menu').append(makeFilterType(filterType));
            });

            /** Use first filter-type (AND) for filtering */
            filterTypeDiv.find('li a').first().click();
        }

        /**
         * Makes tags in application row clickable and adds them to filter after clicking
         *
         */
        function makeTagsClickable() {
            $('div.techs span.label').each(function() {
                var anchored = $('<a href="#"></a>');
                anchored.append($(this).clone());
                anchored.on('click', function() {
                    addFilter($(this).text().trim(), filterOptions[1]);
                });

                $(this).replaceWith(anchored);
            });
        }

        function makeFilterType(filterType) {
            var html = $('<li><a href="#"></li>');
            var a = html.find('a');
            a.text(filterType.name);
            a.data('filterBy', filterType);

            a.on('click', function() {
                $('#filter-type').find('li a').removeClass('selected');
                $(this).addClass('selected');
                currentFilterConfiguration.type = filterType;
                $('.filter-type').text(filterType.name);
                filterData();
            });

            return html;
        }

        /**
         * Checks if object has callback
         *
         * @param object
         * @returns {boolean}
         */
        function hasCallback(object) {
            return object.hasOwnProperty('callback') && typeof object.callback === 'function';
        }

        /**
         * Filters data by filters array
         *
         */
        function filterData() {
            var filteredDivs = $('div.real div.appInfo').map(function(idx, element) {
                var show = true;

                if (filters.length > 0) {
                    var filterResults = filters.map(function (filterOption) {
                        if (hasCallback(filterOption)) {
                            return filterOption.callback(element, filterOption);
                        } else {
                            console.error('Expected callback to be defined on filterOption');
                        }
                    });

                    var reduceOptions = currentFilterConfiguration.type;
                    show = filterResults.reduce(reduceOptions.reducer, reduceOptions.default);
                }

                if (!show) {
                    $(this).hide();
                } else {
                    $(this).show();
                }

                return show;
            }).toArray();

            var countUnfiltered = filteredDivs.length;
            var countFiltered = filteredDivs.filter(function(show) { return show; }).length;

            countResults.text(countFiltered);

            refreshFilterPanel();
        }

        /**
         * Redraws filter panel with used filters labels
         *
         */
        function refreshFilterPanel() {
            activeFilters =  $('#active-filters');
            var newActiveFilters = activeFilters.clone(false);
            newActiveFilters.empty();

            filters.forEach(function(filter) {
                newActiveFilters.append(makeFilteredByLabel(filter));
            });

            activeFilters.replaceWith(newActiveFilters);

            if (filters.length === 0) {
                resultsToolbar.addClass('hidden');
            } else {
                resultsToolbar.removeClass('hidden');
            }
        }

        /**
         * Removes filter from filters array
         *
         * @param item
         * @param node
         */
        function removeFilter(item, node) {
            filters = filters.filter(function(currentItem) { return currentItem !== item; });
            node.remove();
            filterData();
        }

        /**
         * Makes new filtered-by label
         * (used in filtered-by toolbar)
         *
         * @param item {object}
         * @returns {jQuery|HTMLElement}
         */
        function makeFilteredByLabel(item) {
            var html = $('<li><span class="label label-info">\
                    <a href="#"><span class="glyphicon glyphicon-remove"></span></a>\
                    </span></li>');

            var a = html.find('a');
            html.find('span.label').prepend(item.name + ': ' + item.data);
            a.on('click', function() {
                removeFilter(item, html);
            });

            html.data('filter', item);

            return html;
        }

        /**
         * Adds filter to filters array and filters data by it
         *
         * @param value {string}
         * @param option {object}
         */
        function addFilter(value, option) {
            var filter = $.extend({}, option);
            filter.data = value;
            filters.push(filter);

            filterData();
        }

        /**
         * Creates HTML element for available filters list
         *
         * @param filterOption {object}
         * @returns {jQuery|HTMLElement}
         */
        function makeFilterOptionListItem(filterOption) {
            var html = $('<li><a href="#"></li>');
            var a = html.find('a');
            a.text(filterOption.name);
            a.data('filterBy', filterOption);

            a.on('click', function() {
                filterOptionsList.find('li a').removeClass('selected');
                $(this).addClass('selected');
                currentFilterConfiguration.filterBy = filterOption;
                filterByLabel.text(filterOption.name);
            });

            return html;
        }

        initialize();
    }

    /**
     * All sorting related code
     */
    function sorting() {
        var sortDiv = $('#sort');
        var sortBy = $('#sort-by');
        var sortOrder = $('#sort-order');
        var sortIcon = sortOrder.find('span.fa');
        var sortList = sortDiv.find('ul.dropdown-menu');

        var lowerCaseStringComparator = function(a, b) {
            return a.localeCompare(b);
        };

        var sortOptions = [
            { name: 'Name', value: 'name', comparator:  lowerCaseStringComparator },
            { name: 'Story Points', value: 'storypoints' }
        ];

        var currentSortConfiguration = {
            sortBy: sortOptions[0],
            order: 1 // +1 ascending, -1 descending
        };

        var sortOrderClasses = {
            ASC: 'fa-sort-alpha-asc',
            DESC: 'fa-sort-alpha-desc'
        };

        function initialize() {
            $('div.real div.appInfo').each(function (idx, el) {
                $(this).data('name', $(this).find('.fileName').text().trim());
                $(this).data('storypoints', parseInt($(this).find('.effortPoints.total').text().trim()));
            });

            sortOptions.forEach(function(option) {
                sortList.append(makeSortListItem(option));
            });

            /** Sorts applications by name */
            sortList.find('li a').first().click();

            /**
             * On click handler for sort order button
             * Switches between ASC/DESC sorting
             */
            sortOrder.on('click', function() {
                var currentClass;
                var newClass;

                if (currentSortConfiguration.order === 1) {
                    currentClass = sortOrderClasses.ASC;
                    newClass = sortOrderClasses.DESC;
                } else {
                    currentClass = sortOrderClasses.DESC;
                    newClass = sortOrderClasses.ASC;
                }

                currentSortConfiguration.order *= -1;

                sortIcon.removeClass(currentClass);
                sortIcon.addClass(newClass);

                sortData();
            });
        }

        function makeSortListItem(sortOption) {
            var html = $('<li><a href="#"></li>');
            var a = html.find('a');
            a.text(sortOption.name);
            a.data('sortBy', sortOption);

            a.on('click', function() {
                sortList.find('li a').removeClass('selected');
                $(this).addClass('selected');
                currentSortConfiguration.sortBy = sortOption;
                sortBy.text(sortOption.name);
                sortData();
            });

            return html;
        }

        /**
         * Checks if object has comparator
         *
         * @param object
         * @returns {boolean}
         */
        function hasComparator(object) {
            return object.hasOwnProperty('comparator') && typeof object.comparator === 'function';
        }

        /**
         * Sorts applications by specified criteria
         */
        function sortData() {
            $('div.real div.appInfo').sortElements(function(elementA, elementB) {
                var result = 0;

                var a = $(elementA).data(currentSortConfiguration.sortBy.value);
                var b = $(elementB).data(currentSortConfiguration.sortBy.value);

                if (hasComparator(currentSortConfiguration.sortBy)) {
                    result = currentSortConfiguration.sortBy.comparator(a, b);
                } else {
                    result = a > b ? 1 : -1;
                }

                return result * currentSortConfiguration.order;
            });
        }

        initialize();
    }

    filtering();
    sorting();
});
