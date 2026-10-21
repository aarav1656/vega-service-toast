import React, {useEffect} from 'react';
import {Linking, Text, View} from 'react-native';
import {startService} from 'vega-service-toast';

export const App = () => {
  // Nothing starts the service for you: the app starts it by its pkg:// URI.
  useEffect(() => {
    startService('com.example.toast.service', Linking).catch(err => console.log(`service start failed ${String(err)}`));
  }, []);
  return (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      <Text style={{fontSize: 48}}>Toast example</Text>
    </View>
  );
};
