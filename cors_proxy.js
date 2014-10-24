module.exports = function(origin_allowed, application_port) {
    var http = require( 'http' ),
        express = require( 'express' ),
        app = express(),
        fs = require( 'fs' );

    var allowed_types = ['image/jpeg', 'image/png'];

    var settings = {
        origin_allowed: origin_allowed,
        application_port: application_port
    };

    /**
     * Configure Access Control
     * @param req
     * @param res
     * @param next
     */
    var allowCrossDomain = function( req, res, next ) {
        res.header( 'Access-Control-Allow-Origin', settings.origin_allowed );
        res.header( 'Access-Control-Allow-Methods', 'GET' );
        res.header( 'Access-Control-Allow-Headers', 'accept, authorization' );

        next();
    };
    app.use( allowCrossDomain );

    app.get( '/', function( request, response ) {

        var answer;

        if ( !isValidUrl( request.query.image_url ) ) {
            answer = {statusCode: 0, statusText: 'You have specified a wrong url. A request cannot be executed. Note, that only HTTP and FTP protocols supported.'};
        }

        if ( answer ) {
            response.writeHead( 200 );
            response.end( JSON.stringify( answer ) );
        }
        else {
            var unique_name = Math.ceil( Math.random() * 10000000 ),
                filename = 'tmp/' + unique_name + '.' + request.query.image_url.split( '.' ).pop(),
                file;
            http.get( request.query.image_url, function( resp ) {
                if ( resp.statusCode != 200 ) {
                    answer = {statusCode: 0, statusText: 'The url, you\'ve specified, does not exist or the server is unavailable'};
                    response.end( JSON.stringify( answer ) );
                }
                else if ( allowed_types.indexOf( resp.headers['content-type'] ) == -1 ) {
                    answer = {statusCode: 0, statusText: 'File type ' + resp.headers['content-type'] + ' is not allowed. The application accepts the images of types ' + allowed_types.join( ", " ) + ' only.' };
                    response.end( JSON.stringify( answer ) );
                }
                else {
                    file = fs.createWriteStream( 'app/' + filename );
                    resp.pipe( file );
                    resp.on( 'end', function() {
                        answer = {statusCode: 200, createdPath: filename};
                        response.end( JSON.stringify( answer ) );
                    } );
                    setTimeout( function() {
                        fs.unlink( 'app' + filename );
                    }, 120000 );//two minutes later file will be deleted
                }

            } );
        }

    } );

        app.listen( settings.application_port );
        console.log( 'Listening to port ' + settings.application_port + '...' );


    function isValidUrl( url ) {
        var re_weburl = new RegExp(
            '^(?:(?:http|ftp)://)(?:\\S+(?::\\S*)?@)?(?:(?!(?:10|127)(?:\\.\\d{1,3}){3})(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))(?::\\d{2,5})?(?:/\\S*)?$', 'i'
        );
        return re_weburl.test( url );
    }
};