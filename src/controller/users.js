import { connect } from "../databases";

export const logIn = async (req, res) => {
  try {
    //obtener los datos de la request - PASO 1
    const { dni, password } = req.body;

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
        //enviar al front
        return res.status(200).json({ message: "correcto", success: true });
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

    res.json({});
  } catch (error) {
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

    console.log("userexist", userExist);
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
