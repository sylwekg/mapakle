
    var marker;// = [];
    var map;
    var infowindow;
    var messagewindow;

    function initMap() {
        var myLatLng = {lat: 51.9194, lng: 19.1451};

        var newDiv = document.createElement("div");

        var messageWindow ="<div id='form'> <table>";
            messageWindow+="<tr><td>Name:</td> <td><input type='text' id='name'/> </td> </tr>";
            messageWindow+="<tr><td>Xser:</td> <td><input type='text' id='user'/> </td> </tr>";
            messageWindow+="<tr><td></td><td><input type='button' value='Save' onclick='saveData()'/></td></tr>";
            messageWindow+="</table> </div>";
        newDiv.innerHTML=messageWindow;

        // Create a map object and specify the DOM element for display.
            map = new google.maps.Map(document.getElementById('map'), {
            center: myLatLng,
            //scrollwheel: false,
            zoom: 6
        });


        //read all data from DB
        $.getJSON( "http://localhost:3000/points", function( data ) {
            $.each(data, function (ind, point) {
                var coords = point.geometry.loc;
                var latLng = new google.maps.LatLng(coords[0], coords[1]);
                marker=new google.maps.Marker({
                    position: latLng,
                    map: map,
                    title: point.name
                });

                google.maps.event.addListener(marker, 'click', function (event) {
                    var mapa = document.getElementById('map');
                    mapa.appendChild(newDiv);
                    if(infowindow)
                        infowindow.close();
                    infowindow = new google.maps.InfoWindow({
                        content: newDiv         //document.getElementById('form')
                    });

                    var m=this;
                    getData(this.getPosition().lat(), this.getPosition().lng() )
                        .then(function(punkt) {
                        console.log(punkt.name);
                        document.getElementById('name').value=punkt.name;
                        document.getElementById('user').value=punkt.user;
                        infowindow.open(map, m);
                    }).catch(function(Error) {
                        console.log(Error);
                    });

                });
            });
        });

        //funkcja tylko na potrzeby testowe
        $("#add").click(function(){
            var latLng = new google.maps.LatLng($("#lat").val(),$("#lon").val());
            //marker.push(
            marker =
                new google.maps.Marker({
                    map: map,
                    position: latLng
                    //title: point.name
                });

            $.ajax({
                url: "http://localhost:3000/addPoint",
                method: 'POST',
                data: JSON.stringify(
                    {
                        name : "Punkt T",
                        user : "Stanisław",
                        quality : 0,
                        geometry : {
                            type : "Point",
                            loc : [
                                $("#lat").val(),
                                $("#lon").val()
                            ]
                        }
                    }),
                contentType:'application/json',
                success: console.log("nowy punkt zapisany w DB")
            });
        });



        messagewindow = new google.maps.InfoWindow({
            content: document.getElementById('message')
        });

        //add point to the map
        google.maps.event.addListener(map, 'click', function(event) {
             marker = new google.maps.Marker({
                 position: event.latLng,
                 map: map
             });
             google.maps.event.addListener(marker, 'click', function (event) {
                 var mapa = document.getElementById('map');
                 mapa.appendChild(newDiv);
                 infowindow = new google.maps.InfoWindow({
                     content: newDiv         //document.getElementById('form')
                 });
                 infowindow.open(map, this);

             });
        });
    }


    function getData(lat, lon) {
        return new Promise(function(resolve, reject) {
            $.get("http://localhost:3000/getPoint", {lat: lat, lon: lon} )
                .done(function (data) {
                    console.log("Data Loaded: " + JSON.stringify(data));
                    resolve(data);
                })
                .fail(function () {
                    alert("Błąd odczytu danych");
                    reject(Error("Błąd odczytu danych"));
                });
        });
    }

    function saveData() {
        $.ajax({
            url: "http://localhost:3000/addPoint",
            method: 'POST',
            data: JSON.stringify(
                {
                    name : document.getElementById('name').value,
                    user : "Stanisław",
                    quality : 0,
                    geometry : {
                        type : "Point",
                        loc : [ marker.getPosition().lat(), marker.getPosition().lng() ]
                    }
                }),
            contentType:'application/json',
            success: console.log("nowy punkt zapisany w DB")
        });
    }
