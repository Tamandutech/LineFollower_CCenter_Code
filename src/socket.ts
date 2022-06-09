import { defineComponent } from 'vue';

//const host = 'ws://' + document.location.host + '/dashws';
let host = "ws://192.168.1.2/dashws"; // For Local Testing via npm run serve

const socket = new WebSocket(host);

const emitter = defineComponent({
  methods: {
    send(message: string) {
      if (1 === socket.readyState) {
        socket.send(message);
      }
    },
  },
});

socket.onopen = function () {
  emitter.$emit('connected');
  console.log('Connected to ' + host);
};

socket.onclose = function () {
  emitter.$emit('disconnected');
};

socket.onmessage = function (msg) {
  emitter.$emit('message', JSON.parse(msg.data));
};
socket.onerror = function (err) {
  emitter.$emit('error', err);
  console.log('Error: ' + err);
};

export default emitter;
