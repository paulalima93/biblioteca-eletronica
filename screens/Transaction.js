import React, {Component} from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, ImageBackground, TextInput, KeyboardAvoidingView, ToastAndroid } from "react-native";
import * as Permissions from 'expo-permissions'
import { BarCodeScanner } from "expo-barcode-scanner";
import firebase from "firebase";
import db from "../config";

const bgImage = require("../assets/background2.png");
const appIcon = require("../assets/appIcon.png");
const appName = require("../assets/appName.png");

export default class TransactionScreen extends Component {
    constructor(){
        super();
        this.state={
            domState: 'normal',
            hasCameraPermissions: null,
            scanned: false,
            scannedData: "",
            bookId: "",
            studentId: "",
            studentName: "",
            bookName: ""
        }
    }

    getCameraPermission = async domState => {
        const {status} = await Permissions.askAsync(Permissions.CAMERA)

        this.setState({
            hasCameraPermissions: status === "granted",
            domState: domState
        })
    }

    handleBarCodescanned = async ({type, data}) => {
        this.setState({
            scannedData: data,
            scanned: true,
            domState: 'normal'
        })
    }


    handleTransaction = async () => {
        var {bookId, studentId} = this.state;
        await this.getBookDetails(bookId);
        await this.getStudentDetails(studentId);

        var transactionType = await this.checkBookAvailability(bookId);

        if (!transactionType) {
          this.setState({bookId: "", studentId: ""});
          alert("O livro não existe na biblioteca!");

        } else if(transactionType === "issue"){
          var isEligible = await this.checkStudentEligibilityForBookIssue(studentId);

          if (isEligible) {
            var {bookName, studentName} = this.state;
            this.initiateBookIssue(bookId, studentId, bookName, studentName);
            alert("Livro entregue ao aluno");
            }
            //ToastAndroid.show("Livro entregue ao aluno", ToastAndroid.SHORT)
          } else {
            var isEligible = await this.checkStudentEligibilityForBookReturn(bookId, studentId);
            if(isEligible){
              var {bookName, studentName} = this.state;
              this.initiateBookReturn(bookId, studentId, bookName, studentName);
              alert("Livro devolvido à biblioteca");
              
            }
        }
    }

    //PEGAR NOME DO LIVRO
    getBookDetails = bookId => {
    bookId = bookId.trim();
    db.collection("books")
      .where("book_id", "==", bookId)
      .get()
      .then(snapshot => {
        snapshot.docs.map(doc => {
          this.setState({
            bookName: doc.data().book_name
          });
        });
      });
  };

  //PEGAR NOME DO ALUNO
  getStudentDetails = studentId => {
    studentId = studentId.trim();
    db.collection("students")
      .where("student_id", "==", studentId)
      .get()
      .then(snapshot => {
        snapshot.docs.map(doc => {
          this.setState({
            studentName: doc.data().student_name
          });
        });
      });
  };

  //INICIAR ENTREGA
  initiateBookIssue = async (bookId, studentId, bookName, studentName) => {
    // adicionar uma transação
    db.collection("transactions").add({
      student_id: studentId,
      student_name: studentName,
      book_id: bookId,
      book_name: bookName,
      date: firebase.firestore.Timestamp.now().toDate(),
      transaction_type: "issue"
    });
    // alterar status do livro
    db.collection("books")
      .doc(bookId)
      .update({
        is_book_available: false
      });
    // alterar o número de livros retirados pelo aluno
    db.collection("students")
      .doc(studentId)
      .update({
        number_of_books_issued: firebase.firestore.FieldValue.increment(1)
      });

    // atualizando estado local
    this.setState({
      bookId: "",
      studentId: ""
    });
  };

  //INICIAR DEVOLUÇÃO
  initiateBookReturn = async (bookId, studentId, bookName, studentName) => {
    // adicionar uma transação
    db.collection("transactions").add({
      student_id: studentId,
      student_name: studentName,
      book_id: bookId,
      book_name: bookName,
      date: firebase.firestore.Timestamp.now().toDate(),
      transaction_type: "return"
    });
    // alterar status do livro
    db.collection("books")
      .doc(bookId)
      .update({
        is_book_available: true
      });
    // alterar o número de livros retirados pelo aluno
    db.collection("students")
      .doc(studentId)
      .update({
        number_of_books_issued: firebase.firestore.FieldValue.increment(-1)
      });

    // atualizando estado local
    this.setState({
      bookId: "",
      studentId: ""
    });
  };

//checar disponibilidade do livro
checkBookAvailability = async bookId => {
  const bookRef = await db
    .collection("books")
    .where("book_id", "==", bookId)
    .get();

  var transactionType = "";
  if (bookRef.docs.length == 0) {
    transactionType = false;
  } else {
    bookRef.docs.map(doc => {
      //se o livro estiver disponível, o tipo de transação será issue (entregar)
      // caso contrário, será return (devolver)
      transactionType = doc.data().is_book_available ? "issue" : "return";
    });
  }

  return transactionType;
};

  //VERIFICAR SE ALUNO ESTÁ ELEGÍVEL PARA DEVOLVER O LIVRO
  checkStudentEligibilityForBookReturn = async (bookId, studentId) => {
    const transactionRef = await db
      .collection("transactions")
      .where("book_id", "==", bookId)
      .limit(1)
      .get();
    var isStudentEligible = "";
    transactionRef.docs.map(doc => {
      var lastBookTransaction = doc.data();
      if (lastBookTransaction.student_id === studentId) {
        isStudentEligible = true;
      } else {
        isStudentEligible = false;
        alert("O livro não foi retirado por este aluno!");
        this.setState({
          bookId: "",
          studentId: ""
        });
      }
    });
    return isStudentEligible;
  };

  //VERIFICAR SE ALUNO ESTÁ ELEGÍVEL PARA PEGAR LIVRO EMPRESTADO
  checkStudentEligibilityForBookIssue = async studentId => {
    const studentRef = await db
      .collection("students")
      .where("student_id", "==", studentId)
      .get();

    var isStudentEligible = "";
    if (studentRef.docs.length == 0) {
      this.setState({
        bookId: "",
        studentId: ""
      });
      isStudentEligible = false;
     alert("O id do aluno não existe no banco de dados!");
    } else {
      studentRef.docs.map(doc => {
        if (doc.data().number_of_books_issued < 2) {
          isStudentEligible = true;
        } else {
          isStudentEligible = false;
          alert("O aluno já retirou 2 livros!");
          this.setState({
            bookId: "",
            studentId: ""
          });
        }
      });
    }

    return isStudentEligible;
  };


    render(){
        const {domState,scanned, bookId, studentId} = this.state
        if(domState === "scanner") {
            return(
                <BarCodeScanner 
                    onBarCodeScanned={scanned ? undefined : this.handleBarCodescanned}
                    style={StyleSheet.absoluteFillObject}
                />
            )
        }

        return(
            <KeyboardAvoidingView behavior="padding" style={styles.container}>
                <ImageBackground source={bgImage} style={styles.bgImage}>
                <View style={styles.upperContainer}>
                    <Image source={appIcon} style={styles.appIcon} />
                    <Image source={appName} style={styles.appName} />
                </View>
                <View style={styles.lowerContainer}>
                    <View style={styles.textinputContainer}>
                    <TextInput
                        style={styles.textinput}
                        placeholder={"ID do Livro"}
                        placeholderTextColor={"#FFFFFF"}
                        value={bookId}
                        onChangeText = {text => this.setState({bookId: text})}
                    />
                    <TouchableOpacity
                        style={styles.scanbutton}
                        onPress={() => this.getCameraPermissions("bookId")}
                    >
                        <Text style={styles.scanbuttonText}>Digitalizar</Text>
                    </TouchableOpacity>
                    </View>
                    <View style={[styles.textinputContainer, { marginTop: 25 }]}>
                    <TextInput
                        style={styles.textinput}
                        placeholder={"ID do Estudante"}
                        placeholderTextColor={"#FFFFFF"}
                        value={studentId}
                        onChangeText = {text => this.setState({studentId: text})}
                    />
                    <TouchableOpacity
                        style={styles.scanbutton}
                        onPress={() => this.getCameraPermissions("studentId")}
                    >
                        <Text style={styles.scanbuttonText}>Digitalizar</Text>
                    </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.button} onPress={this.handleTransaction}>
                        <Text style={styles.buttonText}> Enviar </Text>
                    </TouchableOpacity>
                </View>
                </ImageBackground>
            </KeyboardAvoidingView>
        )
    }
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#FFFFFF"
    },
    bgImage: {
      flex: 1,
      resizeMode: "cover",
      justifyContent: "center"
    },
    upperContainer: {
      flex: 0.5,
      justifyContent: "center",
      alignItems: "center"
    },
    appIcon: {
      width: 200,
      height: 200,
      resizeMode: "contain",
      marginTop: 80
    },
    appName: {
      width: 180,
      resizeMode: "contain"
    },
    lowerContainer: {
      flex: 0.5,
      alignItems: "center"
    },
    textinputContainer: {
      borderWidth: 2,
      borderRadius: 10,
      flexDirection: "row",
      backgroundColor: "#9DFD24",
      borderColor: "#FFFFFF"
    },
    textinput: {
      width: "57%",
      height: 50,
      padding: 10,
      borderColor: "#FFFFFF",
      borderRadius: 10,
      borderWidth: 3,
      fontSize: 18,
      backgroundColor: "#5653D4",
      fontFamily: "Rajdhani_600SemiBold",
      color: "#FFFFFF"
    },
    scanbutton: {
      width: 100,
      height: 50,
      backgroundColor: "#9DFD24",
      borderTopRightRadius: 10,
      borderBottomRightRadius: 10,
      justifyContent: "center",
      alignItems: "center"
    },
    scanbuttonText: {
      fontSize: 20,
      color: "#0A0101",
      fontFamily: "Rajdhani_600SemiBold"
    },
    button: {
        width: "20%",
        height: 55,
        borderRadius: 10,
        backgroundColor: "#9DFD24",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 20
      },
      buttonText: {
        fontSize: 20,
        color: "black",
        fontWeight: "bold",
        fontFamily: "Rajdhani_600SemiBold"
      }
  });