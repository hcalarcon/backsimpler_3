import { connect } from "../databases";
import jwt from "jsonwebtoken";
const claveSecreta = process.env.SECRET_KEY;

export const logIn = async (req, res) => {
  try {
    //obtener los datos de la request - PASO 1
    const { dni, password } = req.body;

    const token = getToken({ dni: dni });

    return res.status(200).json({ success: true, token: token });

    //obtener el objeto conexión - PASO 2
    const cnn = await connect();

    const q = `SELECT pass FROM alumno WHERE dni=?`;
    const value = [dni];

    const [result] = await cnn.query(q, value);

    if (result.length > 0) {
      //el usuario existe
      //comprar las contraseñas
      if (result[0].pass === password) {
        // contraseña igual
        //crear un token
        const token = getToken({ dni: dni });
        //enviar al front
        return res
          .status(200)
          .json({ message: "correcto", success: true, token: token });
      } else {
        return res
          .status(400)
          .json({ message: "la contraseña no coincide", success: false });
      }
    } else {
      //usuario no existe
      return res
        .status(400)
        .json({ message: "user no existe", success: false });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "fallo en chatch", error: error });
  }
};

const validate = async (campo, valor, tabla, cnn) => {
  //q guarda el query
  const q = `SELECT * FROM ${tabla} WHERE ${campo}=?`;
  const value = [valor];

  const [result] = await cnn.query(q, value);

  return result.length === 1; //nos devuelve verdadero si hay un usuario y falso si no existe
};

//crear usuarios desde el sigup
export const createUsers = async (req, res) => {
  try {
    //establecer la conexion a la bd -> instanciando un objeto conexion
    const cnn = await connect();
    //obtener lo que envio el front
    const { dni, nombre, password } = req.body;

    const userExist = await validate("dni", dni, "alumno", cnn);

    //validar la existencia de el dni
    if (userExist)
      return res.status(400).json({ message: "el usuario ya existe" });

    //insertar un registro a la base de datos -> usuario
    const [result] = await cnn.query(
      "INSERT INTO alumno ( dni, nombre, pass) VALUE (?,?,?)",
      [dni, nombre, password]
    );

    if (result.affectedRows === 1) {
      return res
        .status(200)
        .json({ message: "se creo el usuario", success: true });
    } else {
      return res
        .status(500)
        .json({ message: "no se creo el usuario", success: false });
    }
  } catch (error) {
    return res.status(500).json({ message: error, success: false });
  }
};

//funcion para autenticar el token
//middleware
export const auth = (req, res, next) => {
  //obtener el token desde la peticion
  const tokenFront = req.headers["auth"];

  //verificar que hay un token
  if (!tokenFront) return res.status(400).json({ message: "no hay token" }); //si no existe el troken en la peticion

  //si hay token, debemos validarlo
  jwt.verify(tokenFront, claveSecreta, (error, payload) => {
    if (error) {
      //si el token no es validor
      return res.status(400).json({ message: " el token no es valido" });
    } else {
      //el token es valido
      req.payload = payload;
      next();
    }
  });
};

//me de la lista de las materias de un alumno
export const getMateriasbyDni = (req, res) => {
  //vamos a simular el acceso a la base de datos para obtener la lista de materias que un alumno esta cursando
  //obtener el dni de la request
  const dni = req.payload;
  console.log(dni);
  //acceder a la base datos
  const materias = [
    { id: 1, nombre: "so2" },
    { id: 2, nombre: "web" },
    { id: 3, nombre: "arquitectura" },
    { id: 4, nombre: "so2" },
    { id: 5, nombre: "web" },
    { id: 6, nombre: "arquitectura" },
  ];

  return res.status(200).json(materias);
};

//funciones privadas
//funcion que devuelte el token
const getToken = (payload) => {
  const token = jwt.sign(payload, claveSecreta, { expiresIn: "3600m" });
  return token;
};
