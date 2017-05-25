

// ===================== Cala obsługa mapy ===========================================================================
    var marker;
    var markers=[];
    var map, mapa;
    var infowindow;
    var messagewindow;
    var newDiv;
    var HOST_URL = "http://192.168.1.102:3000";

    var messageWindow ="<div id='form'> <table>";
    messageWindow+="<tr><td>Name:</td> <td><input type='text' id='name'/> </td> </tr>";
    messageWindow+="<tr><td>Xser:</td> <td><input type='text' id='user'/> </td> </tr>";
    messageWindow+="<tr><td></td><td><input id='saveButton' type='button' value='Save' /></td></tr>";
    messageWindow+="</table> </div>";

    newDiv = document.createElement("div");
    newDiv.innerHTML=messageWindow;



function initMap() {
        var myLatLng = {lat: 51.9194, lng: 19.1451}; //środek polski

        // Create a map object and specify the DOM element for display.
        map = new google.maps.Map(document.getElementById('map'), {
            center: myLatLng,
            //scrollwheel: false,
            zoom: 6
        });

        mapa = document.getElementById('map');
        mapa.appendChild(newDiv);


        var mapArea;
        google.maps.event.addListener(map,'idle' , function (event) {
            mapArea = map.getBounds().toJSON();
            console.log(mapArea);

            // pobierz punkty
            getAreaPoints(mapArea.south, mapArea.west, mapArea.north, mapArea.east)
                .then(function(punkty) {
                    // wyswietl punkty na mapie
                    displayPoints(punkty, map);
                    console.log("liczba wyswietlanych punktow: ",punkty.length);
                });
        });

        messagewindow = new google.maps.InfoWindow({
            content: document.getElementById('message')
        });



        //add point to the map by click
        google.maps.event.addListener(map, 'click', function(event) {
             console.log('kliknąleś w mape');
             //uzuniecie starego jesli byl
            if(marker===markers[markers.length-1]) {
                //console.log('kasuje stary marker : ', marker.getPosition().toJSON());
                delete marker;
            } else {
                marker.setMap(null) ;
                delete marker;
            }

             //dodanie nowego
             marker = new google.maps.Marker({
                 position: event.latLng,
                 map: map
             });


            google.maps.event.addListener(marker, 'click', function (event) {
                //console.log('kliknales w marker',marker);
                //console.log('kliknales w event',event);

                mapa = document.getElementById('map');

                mapa.appendChild(newDiv);
                if(infowindow)
                    infowindow.close();
                messagewindow.close();
                infowindow = new google.maps.InfoWindow({
                    content: newDiv         //document.getElementById('form')
                });
                document.getElementById('name').value='';
                document.getElementById('user').value='';
                document.getElementById('saveButton').style.visibility = "visible";
                infowindow.open(map, this);
                var mark=this;
                $("#saveButton").click(function() {
                    console.log("przycisk klikniety, na rzecz objektu: ",mark);
                    saveData(marker);
                    newDiv.parentNode.removeChild(newDiv);
                });
            });
        });
   }



    function getData(id) {
        return new Promise(function(resolve, reject) {
            $.get("/getPoint" ,{"id": id}  )
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

    function getAreaPoints(swlat, swlon, nelat, nelon) {
        return new Promise(function(resolve, reject) {
            $.get("/getAreaPoints" ,{"locsw[]": [swlat,swlon], "locne[]":[nelat,nelon]}  )  // {lat: lat, lon: lon} )
                .done(function (data) {
                    console.log("Data Loaded: " + JSON.stringify(data));
                    resolve(data);
                })
                .fail(function () {
                    alert("Błąd pobierania danych danych");
                    reject(Error("Błąd odczytu danych"));
                });
        });
    }


    function displayPoints(data, map) {
        //dokładanie nowych punktow na ekran i do markers[]
        $.each(data, function (ind, point) {
            if (markers.map(function (marker) {
                    return marker.id;
                }).indexOf(point._id) > -1) {
                console.log("punkt juz istnieje >", point._id);

            } else {
                console.log("dodaje nowy punkt : ", point._id);
                dodajPunktNaMape(point);
            }
        });

        // czyszczenie niewidocznych markerow
        for (ind = 0; ind < markers.length; ind++) {
            if (!map.getBounds().contains(markers[ind].position)) {
                markers[ind].map = null;
                markers.splice(ind, 1);
            }
        }
        console.log('liczba markerow w pamieci :', markers.length);
    }

    function dodajPunktNaMape(point) {
        var coords = point.geometry.loc;
        var latLng = new google.maps.LatLng(coords[0], coords[1]);
        marker = new google.maps.Marker({
            position: latLng,
            map: map,
            title: point.name,
            id: point._id
        });
        markers.push(marker);

        // interaktywnosc punktu
        google.maps.event.addListener(marker, 'click', function (event) {
            //var mapa = document.getElementById('map');


            if(infowindow)
                infowindow.close();
            messagewindow.close();
            infowindow = new google.maps.InfoWindow({
                content: newDiv         //document.getElementById('form')
            });

            var m=this;
            getData(this.id )
                .then(function(punkt) {
                    console.log(punkt.name);
                    document.getElementById('name').value=punkt.name;
                    document.getElementById('user').value=punkt.user;
                    document.getElementById('saveButton').style.visibility = "hidden";
                    infowindow.open(map, m);
                }).catch(function(Error) {
                console.log(Error);
            });
        });
    }

    function saveData(marker) {
        $.ajax({
            url: "/addPoint",
            method: 'POST',
            data: JSON.stringify(
                {
                    name : document.getElementById('name').value,
                    user : document.getElementById('user').value,
                    quality : 0,
                    geometry : {
                        type : "Point",
                        loc : [ marker.getPosition().lat(), marker.getPosition().lng() ]
                    }
                }),
            contentType:'application/json'
        })
        .done(function (data) {
            console.log("nowy punkt zapisany w DB ",data);
            infowindow.close();
            messagewindow.open(map, marker);
            markers.push(marker);
        })
        .fail(function (data) {
            console.log("błąd zapisu w DB :",data);
        });
    }
//-------------------------------------------------------------------------------------------------------------
//
//     //funkcja tylko na potrzeby testowe
//     $("#checkArea").click(function() {
//         getAreaPoints($("#swlat").val(), $("#swlon").val(), $("#nelat").val(), $("#nelon").val());
//         //var latLng = new google.maps.LatLng($("#lat").val(), $("#lon").val());
//     });
//
//     //funkcja tylko na potrzeby testowe
//     $("#add").click(function(){
//         var latLng = new google.maps.LatLng($("#lat").val(),$("#lon").val());
//         //marker.push(
//         marker =
//             new google.maps.Marker({
//                 map: map,
//                 position: latLng
//                 //title: point.name
//             });
//
//         $.ajax({
//             url: "http://localhost:3000/addPoint",
//             method: 'POST',
//             data: JSON.stringify(
//                 {
//                     name : "Punkt T",
//                     user : "Stanisław",
//                     quality : 0,
//                     geometry : {
//                         type : "Point",
//                         loc : [
//                             $("#lat").val(),
//                             $("#lon").val()
//                         ]
//                     }
//                 }),
//             contentType:'application/json'
//             //success: console.log("nowy punkt zapisany w DB")
//         })
//         .done(function (data) {
//             console.log("nowy punkt zapisany w DB");
//             infowindow.close();
//             messagewindow.open(map, marker);
//         })
//         .fail(function (data) {
//             console.log("błąd zapisu w DB");
//         });
//     });