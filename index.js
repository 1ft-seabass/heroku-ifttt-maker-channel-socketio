// JSONファイルの読み込み（ローカル用）/////////////////////////////////
var fs = require('fs');
var setting = {};

var IFTTT_EVENT_NAME = "";
var IFTTT_SECURITY_KEY = "";
if( process.env.PORT ) {
  // Heroku上では環境変数から読み込む（インストール時に設定）
  IFTTT_EVENT_NAME = process.env.IFTTT_EVENT_NAME;
  IFTTT_SECURITY_KEY = process.env.IFTTT_SECURITY_KEY;
} else {
  // .envフォルダはあらかじめ .gitignore 対象にしておく。
  setting = JSON.parse(fs.readFileSync('.env/setting.json', 'utf8'));
  //
  IFTTT_EVENT_NAME = setting.IFTTT_EVENT_NAME;
  IFTTT_SECURITY_KEY = setting.IFTTT_SECURITY_KEY;
}

console.log("IFTTT_EVENT_NAME:" + IFTTT_EVENT_NAME);
console.log("IFTTT_SECURITY_KEY:" + IFTTT_SECURITY_KEY);

//////////////////////////////////////////////

//////////////////////////////////////////////

var express = require('express');
var request = require('request');
var bodyParser = require('body-parser');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

// ドメインの開放
io.set("origins","*:*");

// SocketIOの接続成立
io.on('connection', function(socket){
  console.log('connection')
  console.log(socket);
  // メッセージ受信
  socket.on('message', function(data){
    io.emit('receiveMessage', data);
  });
  // WEBからIFTTTへ送信
  socket.on('sendHeroku', function(data){
    io.emit('receiveMessage', data);
    console.log(data);
    // 実際の送信する sendIFTTT
    sendIFTTT(
        data.value1,
        data.value2,
        data.value3
    );
  });
});


app.get('/', function(request, response) {
  response.send('Hello World!');
});

// IFTTTから送信されてきた情報をWEBに通知する
app.post('/ifttt/receive', function(request, response) {
  response.set('Content-Type', 'application/json');
  console.log('---------- input[/ifttt/receive]');
  console.log(request.body);
  response.send("{'request':'/ifttt/receive'}");
  io.emit( "receiveIFTTT" , request.body );
});

http.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

// 実際の送信する sendIFTTT
function sendIFTTT(value1,value2,value3){
  var _request = require('request');

  var options = {
    uri: 'http://maker.ifttt.com/trigger/' + IFTTT_EVENT_NAME + '/with/key/' + IFTTT_SECURITY_KEY,
    form: {
      value1:value1,
      value2:value2,
      value3:value3
    },
    json: true
  };

  console.log('---------- [' + IFTTT_EVENT_NAME + ']');
  console.log(options);

  _request.post(options, function(error, response, body){
    if (!error && response.statusCode == 200) {
      console.log(body);
    } else {
      console.log('error: '+ response.statusCode);
    }
  });

}