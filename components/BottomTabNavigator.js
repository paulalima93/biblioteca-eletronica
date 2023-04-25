import React, {Component} from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import TransactionScreen from "../screens/Transaction";
import SearchScreen from "../screens/Search";
import Ionicons from 'react-native-vector-icons/Ionicons'

const Tab = createBottomTabNavigator();

export default class BottomTabNavigator extends Component {
    render(){
        return(
           <NavigationContainer>
            <Tab.Navigator
                screenOptions={({route}) => ({
                    headerShown: false,
                    tabBarIcon: ({ focused, color, size }) => {
                        let iconName;
            
                        if (route.name === 'Transação') {
                          iconName = focused
                            ? 'book'
                            : 'book-outline';
                        } else if (route.name === 'Pesquisa') {
                          iconName = focused ? 'search' : 'search-outline';
                        }
            
                       
                        return <Ionicons name={iconName} size={size} color={color} />;
                      },
                      
                })}
                tabBarOptions={{
                    activeTintColor: "#FFFFFF",
                    inactiveTintColor: "black",
                    style: {
                      height: 130,
                      borderTopWidth: 0,
                      backgroundColor: "#5653d4"
                    },
                    labelStyle: {
                      fontSize: 20,
                      fontFamily: "Rajdhani_600SemiBold"
                    },
                    labelPosition: "beside-icon",
                    tabStyle: {
                      marginTop: 0,
                      borderRadius: 15,
                      borderWidth: 2,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#5653d4"
                    }
                  }}
                
            >
                <Tab.Screen name="Transação" component={TransactionScreen}/>
                <Tab.Screen name="Pesquisa" component={SearchScreen}/>
            </Tab.Navigator>
           </NavigationContainer>
        )
    }
}