import { defineStore } from 'pinia';
import ws from 'src/ws';

const feedbackBgStateMap = new Map<string, string>([
  ['waiting', 'blue-grey'],
  ['success', 'positive'],
  ['error', 'negative'],
  ['inactive', 'warning'],
]);

export const useMessage = defineStore('message', {
  state: () => {
    return {
      waitingResponse: false,
      showMessageFeedback: false,
      messageResult: 'waiting',
      socket: ws,
    };
  },
  getters: {
    feedbackDialogBg: (state) =>
      `bg-${feedbackBgStateMap.get(state.messageResult)}`,
  },
  actions: {
    sendMessage(message: string) {
      this.waitingResponse = true;
      this.showMessageFeedback = true;
      ws.send(message);
    },
    setResultFeedback(event: MessageEvent) {
      this.waitingResponse = false;
      const received = event.data as LineFollowerCommandCenter.Message;
      if (received.data === 'OK') {
        this.messageResult = 'success';
      } else {
        this.messageResult = 'error';
      }
      setTimeout(() => {
        this.showMessageFeedback = false;
      }, 2500);
    },
    addMessageHandler(handler: (event: MessageEvent) => void) {
        this.socket.addEventListener('message', (event: MessageEvent) => {
          this.setResultFeedback(event);
          handler(event);
        })
    }
  },
});
