/*global THREE:true BinaryReader:true */
THREE.STLLoader = function() {
    
    THREE.EventDispatcher.call( this );
}

THREE.STLLoader.prototype.load = function (url) {
    var scope = this;
    console.log("Attempting to load URL: [" + url + "]");
    
    var xhr = new XMLHttpRequest();
    
    function onloaded( event ) {
    
        if ( event.target.status === 200 || event.target.status === 0 ) {
                var data = event.target.responseText;
                return scope.dispatchEvent({
                    type: 'load',
                    content: scope.parse(data)
                });
        } else {

            scope.dispatchEvent( { type: 'error', message: 'Couldn\'t load URL [' + url + ']',
                response: event.target.responseText } );
    
        }
    
    }
    
    xhr.addEventListener( 'load', onloaded, false );
    
    xhr.addEventListener( 'progress', function ( event ) {
    
        scope.dispatchEvent( { type: 'progress', loaded: event.loaded, total: event.total } );
    
    }, false );
    
    xhr.addEventListener( 'error', function () {
    
        scope.dispatchEvent( { type: 'error', message: 'Couldn\'t load URL [' + url + ']' } );
    
    }, false );
    
    xhr.overrideMimeType('text/plain; charset=x-user-defined');
    xhr.open( 'GET', url, true );
    xhr.send( null );
};

THREE.STLLoader.prototype.parse = function (data) {
    var isBinary,
        _this = this;
    isBinary = function (data) {
        // TODO: Is this safer then the previous check which is checking 
        // if solid is at the start of ASCII file???
        var expect, face_size, n_faces, reader;
        reader = new BinaryReader(data);
        reader.seek(80);
        face_size = (32 / 8 * 3) + ((32 / 8 * 3) * 3) + (16 / 8);
        n_faces = reader.readUInt32();
        expect = 80 + (32 / 8) + (n_faces * face_size);
        return expect === reader.getSize();
    };
    if (isBinary(data)) {
        return this.parseBinary(data);
    } else {
        return this.parseASCII(data);
    }
};

THREE.STLLoader.prototype.parseBinary = function (data) {
    var face, geometry, n_faces, readFloat3, reader, _fn, _i;
    reader = new BinaryReader(data);
    readFloat3 = function () {
        return [reader.readFloat(), reader.readFloat(), reader.readFloat()];
    };
    reader.seek(80);
    n_faces = reader.readUInt32();
    geometry = new THREE.Geometry();
    _fn = function (face) {
        var length, normal, v1, _j;
        v1 = readFloat3();
        normal = new THREE.Vector3(v1[0],v1[1],v1[2]);
        for (_j = 1; _j <= 3; _j++) {
            v1 = readFloat3();
            geometry.vertices.push(new THREE.Vector3(v1[0],v1[1],v1[2]));
        }
        reader.readUInt16();
        length = geometry.vertices.length;
        return geometry.faces.push(new THREE.Face3(length - 3, length - 2, length - 1, normal));
    };
    for (face = _i = 0; 0 <= n_faces ? _i < n_faces : _i > n_faces; face = 0 <= n_faces ? ++_i : --_i) {
        _fn(face);
    }
    geometry.computeCentroids();
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    return geometry;
};

THREE.STLLoader.prototype.parseASCII = function (data) {
    var geometry, length, normal, patternFace, patternNormal, patternVertex, result, text;
    geometry = new THREE.Geometry();
    patternFace = /facet([\s\S]*?)endfacet/g;
    while (((result = patternFace.exec(data)) != null)) {
        text = result[0];
        patternNormal = /normal[\s]+([\-+]?[0-9]+\.?[0-9]*([eE][\-+]?[0-9]+)?)+[\s]+([\-+]?[0-9]*\.?[0-9]+([eE][\-+]?[0-9]+)?)+[\s]+([\-+]?[0-9]*\.?[0-9]+([eE][\-+]?[0-9]+)?)+/g;
        while (((result = patternNormal.exec(text)) != null)) {
            normal = new THREE.Vector3(parseFloat(result[1]), parseFloat(result[3]), parseFloat(result[5]));
        }
        patternVertex = /vertex[\s]+([\-+]?[0-9]+\.?[0-9]*([eE][\-+]?[0-9]+)?)+[\s]+([\-+]?[0-9]*\.?[0-9]+([eE][\-+]?[0-9]+)?)+[\s]+([\-+]?[0-9]*\.?[0-9]+([eE][\-+]?[0-9]+)?)+/g;
        while (((result = patternVertex.exec(text)) != null)) {
            geometry.vertices.push(new THREE.Vector3(parseFloat(result[1]), parseFloat(result[3]), parseFloat(result[5])));
        }
        length = geometry.vertices.length;
        geometry.faces.push(new THREE.Face3(length - 3, length - 2, length - 1, normal));
    }
    geometry.computeCentroids();
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    return geometry;
};