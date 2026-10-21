// The service's JS entry (the app's index.js registers the UI; this file registers the service).
import {HeadlessEntryPointRegistry} from '@amazon-devices/headless-task-manager';
import {buildToast, postToast, registerService} from 'vega-service-toast';

const SERVICE_ID = 'com.example.toast.service';

registerService(
  SERVICE_ID,
  {
    onStart: async () => {
      // Return quickly: the system ends a start that has not returned in about 8 s.
      setTimeout(async () => {
        await postToast(
          buildToast({
            title: 'Hello from a service',
            description: 'This toast is drawn over whatever app is on screen.',
            iconUri: 'https://example.com/icon.png',
            launchUri: 'pkg://com.example.toast.main',
            launchTitle: 'Open',
          }),
        );
      }, 1000);
    },
    onStop: async () => {},
  },
  HeadlessEntryPointRegistry,
);
