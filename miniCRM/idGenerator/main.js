$(function() {
    const ui = {
        'gt': {
            'count': $('#gt-count'),
            'accode': $('#gt-accode'),
            'tb': $('#gt-tb'),
            'run': $('#gt-run'),
            'result': $('#gt-result')
        }
    };

    // dom events
    ui.gt.run.on('click', gtRunButtonHandler);

    // events handler functions
    function gtRunButtonHandler (evt) {
        let params = {
            'count': ui.gt.count.val(),
            'accode': ui.gt.accode.val(),
            'tb': ui.gt.tb.val()
        };
        let uniqueIds = getIDs(params);
        ui.gt.result.val(uniqueIds);
    }

    // calcute functions
    function getIDs(params) {
        let ids = '';
        
        if (params.count === 0) {
            ids = ids + params.accode + '.' + params.tb + '.' + 
                    sha256(String(Date.now()));
        }

        if (params.count > 0) {
            for (let i = params.count; i > 0; i--) {
                ids = ids + params.accode + '.' + params.tb + '.' +
                        sha256(String(Date.now()) + i) + '\n';
            }
        }

        return ids;
    }
});