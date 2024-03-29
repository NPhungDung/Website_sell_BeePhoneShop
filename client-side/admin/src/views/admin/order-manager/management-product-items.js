import React, { useEffect, useRef, useState } from "react";
import { read, utils, writeFile } from "xlsx";
import * as XLSX from "xlsx";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
  useParams,
} from "react-router-dom";
import { Button, Empty, Table } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import {
  Box,
  Dialog,
  DialogContent,
  FormControl,
  IconButton,
  MenuItem,
  Pagination,
  Select,
  Slide,
  TextField,
  Tooltip,
} from "@mui/material";
import Card from "../../../components/Card";
import { format } from "date-fns";
import axios from "axios";
import { parseInt } from "lodash";
import { DemoContainer } from "@mui/x-date-pickers/internals/demo";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import BorderColorOutlinedIcon from "@mui/icons-material/BorderColorOutlined";
import Zoom from "@mui/material/Zoom";
import * as dayjs from "dayjs";
import {
  Notistack,
  OrderStatusString,
  OrderTypeString,
  StatusImei,
} from "./enum";
import LoadingIndicator from "../../../utilities/loading";
import { FaPencilAlt } from "react-icons/fa";
import { ImportExcelImei, ImportExcelImeiSave } from "./import-imei-by";
import { FaDownload, FaUpload } from "react-icons/fa6";
import KeyboardArrowDownOutlinedIcon from "@mui/icons-material/KeyboardArrowDownOutlined";
import ImportAndExportExcelImei from "../../../utilities/excelUtils";
import { request } from "../../../store/helpers/axios_helper";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHouse } from "@fortawesome/free-solid-svg-icons";
import { ModalUpdateProduct } from "./AlertDialogSlide";
import useCustomSnackbar from "../../../utilities/notistack";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});
const ManagementProductItems = (
  {
    /*  open, close, productItems, productName */
  }
) => {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const handleUploadClick = (id) => {
    setIdProduct(id);
    inputRef.current.click();
  };
  const { handleOpenAlertVariant } = useCustomSnackbar();
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [totalPages, setTotalPages] = useState();
  const [refreshPage, setRefreshPage] = useState(1);
  const [searchParams, setSearchParams] = useSearchParams();
  const [keyword, setKeyword] = useState(searchParams.get("keyword"));
  const [currentPage, setCurrentPage] = useState(
    searchParams.get("currentPage") || 1
  );
  const [productName, setProductName] = useState("");
  const [statusProduct, setStatusProduct] = useState();
  const [idProduct, setIdProduct] = useState("");
  const [priceProduct, setPriceProduct] = useState();

  const [imeis, setImeis] = useState([]);
  const [selectedImei, setSelectedImei] = useState([]);
  const [selectedImeiRefresh, setSelectedImeiRefresh] = useState([]);

  const [refreshUpdate, setRefreshUpdate] = useState([]);
  const [openUpdateProduct, setOpenUpdateProduct] = useState(false);

  const handleCloseOpenUpdateProduct = () => {
    setOpenUpdateProduct(false);
  };

  const { id } = useParams();

  const [listImeiCurrent, setListImeiCurrent] = useState([]);
  const getAllImei = () => {
    request("GET", `/api/imeis/all`, {})
      .then((response) => {
        setListImeiCurrent(response.data.data);
        console.log(response.data.data);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  // useEffect(() => {
  //   setProducts(productItems);
  // }, [productItems]);

  const handleRedirectCreateProduct = () => {
    navigate(`/dashboard/create-product`);
  };

  const [openModalImel, setOpenModalImei] = useState(false);

  const handleOpenModalImei = () => {
    setOpenModalImei(true);
  };

  const handleCloseModalImei = () => {
    setOpenModalImei(false);
  };

  const OrderTable = () => {
    return (
      <>
        <Table
          className="table-container "
          columns={columns}
          rowKey="ma"
          dataSource={products}
          rowClassName={(record) =>
            record.soLuongTonKho < 0 ? "disable-product" : ""
          }
          pagination={false}
          locale={{ emptyText: <Empty description="Không có dữ liệu" /> }}
        />
      </>
    );
  };

  const getProductsItemById = async () => {
    setIsLoading(true);
    await request("GET", `/api/products/product-items/${id}`)
      .then(async (response) => {
        setProducts(response.data.data);

        setIsLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    getProductsItemById();
    getAllImei();
  }, []);

  // useEffect(() => {
  //   if (imeis.length > 0) {
  //     handleAddImei(imeis);
  //   }
  // }, [imeis]);

  const countPrice = (price, afterDiscount) => {
    return price - afterDiscount;
  };

  const handleUpdateProduct = async (price, status) => {
    setIsLoading(true);
    const requestBody = {
      id: idProduct,
      donGia: price,
      trangThai: status,
    };
    try {
      await request("PUT", `/api/products`, requestBody).then(async (res) => {
        await getProductsItemById();
        handleCloseOpenUpdateProduct();
        handleOpenAlertVariant("Cập nhật thành công!", Notistack.SUCCESS);
        setIsLoading(false);
      });
    } catch (error) {
      console.error(error);
      handleOpenAlertVariant(error.response.data.message, "warning");
      setIsLoading(false);
    }
  };

  // const handleUpdateProduct = async (price, status) => {
  //   try {
  //     await axios.put(`http://localhost:8080/api/products`, requestBody, {
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //     }).then(async (response) => {
  //     });
  //   } catch (error) {
  //   }
  // };

  const handleAddImei = async (imeis) => {
    setIsLoading(true);
    const requestBody = {
      imeis: imeis,
      id: idProduct,
    };
    console.log(idProduct);
    try {
      await request("PUT", `/api/products/imeis`, requestBody).then(
        async (res) => {
          await getProductsItemById();
          handleOpenAlertVariant("Import IMEI thành công!", Notistack.SUCCESS);
          setIsLoading(false);
        }
      );
    } catch (error) {
      console.error(error);
      handleOpenAlertVariant(error.response.data.message, "warning");
      setIsLoading(false);
    }
  };
  const handleImport = ($event) => {
    const files = $event.target.files;
    if (files.length) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const wb = read(event.target.result, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];

        // const imeis = [];
        const duplicateSet = new Set(); // Đối tượng Set để theo dõi giá trị trùng lặp

        const range = XLSX.utils.decode_range(sheet["!ref"]);
        for (let row = 4; row < range.e.r; row++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: 2 }); // Cột C
          const cellValue = sheet[cellAddress] ? sheet[cellAddress].v : "";

          if (cellValue !== "") {
            const isNumeric = /^\d+$/.test(cellValue);
            if (!isNumeric) {
              setIsLoading(false);
              handleOpenAlertVariant("IMEI không hợp lệ!", Notistack.ERROR);
              $event.target.value = null;
              return; // Kết thúc hàm nếu có giá trị trùng lặp
            }
            if (duplicateSet.has(cellValue)) {
              setIsLoading(false);
              handleOpenAlertVariant(
                "Import thất bại, IMEI trong sheet không được trùng lặp!",
                Notistack.ERROR
              );
              $event.target.value = null;
              return; // Kết thúc hàm nếu có giá trị trùng lặp
            }
            if (
              listImeiCurrent.some(
                (item) => item.soImei.toString() === cellValue.toString()
              )
            ) {
              setIsLoading(false);
              handleOpenAlertVariant(
                "Import thất bại, IMEI đã tồn tại trong hệ thống!",
                Notistack.ERROR
              );
              $event.target.value = null;
              return; // Kết thúc hàm nếu có giá trị trùng lặp
            }
            duplicateSet.add(cellValue); // Thêm giá trị vào đối tượng Set

            const newImeis = [
              ...imeis,
              {
                imei: cellValue,
                createdAt: new Date(),
                trangThai: StatusImei.NOT_SOLD,
              },
            ];
            setImeis(newImeis);
            // imeis.push({ imei: cellValue, createdAt: new Date(), trangThai: StatusImei.NOT_SOLD });
          }
          // else {
          //   alert("null");
          //   setIsLoading(false);
          //   handleOpenAlertVariant("IMEI không hợp lệ!", Notistack.ERROR);
          //   $event.target.value = null;
          //   return; // Kết thúc hàm nếu có giá trị trùng lặp
          // }
        }
        console.log(listImeiCurrent);
        $event.target.value = null;
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const columns = [
    {
      title: "STT",
      align: "center",
      dataIndex: "stt",
      width: "5%",
      render: (text, record, index) => (
        <span style={{ fontWeight: "400" }}>
          {products.indexOf(record) + 1}
        </span>
      ),
    },
    {
      title: "Ảnh",
      align: "center",
      key: "ma",
      width: "15%",
      render: (text, item) => (
        <>
          <div style={{ position: "relative" }}>
            {item.image !== null ? (
              <img
                src={item.image.path}
                class=""
                alt=""
                style={{ width: "125px", height: "125px" }}
              />
            ) : (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                width="90"
                height="90"
                style={{
                  width: "125px",
                  height: "125px",
                  color: "rgb(232, 234, 235)",
                  margin: "0px auto",
                }}
              >
                <path
                  d="M19 3H5c-1.103 0-2 .897-2 2v14c0 1.103.897 2 2 2h14c1.103 0 2-.897 2-2V5c0-1.103-.897-2-2-2ZM5 19V5h14l.002 14H5Z"
                  fill="currentColor"
                ></path>
                <path
                  d="m10 14-1-1-3 4h12l-5-7-3 4ZM8.5 11a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"
                  fill="currentColor"
                ></path>
              </svg>
            )}
            {item &&
              item.donGiaSauKhuyenMai !== null &&
              item.donGiaSauKhuyenMai !== 0 && (
                <div
                  className="category"
                  style={{
                    userSelect: "none",
                    backgroundColor: "#ffcc00",
                    position: "absolute",
                    top: "0px",
                    borderTopLeftRadius: `8px`,
                    fontSize: "11px",
                    borderTopRightRadius: `20px`,
                    borderBottomRightRadius: `20px`,
                    fontWeight: "600",
                    padding: "4px 8px", // Add padding for better visibility
                    // width: "auto",
                    // height: "30px"
                    marginLeft: "10px",
                    // marginTop: "25px",
                  }}
                >
                  Giảm{" "}
                  {countPrice(
                    item.donGia,
                    item.donGiaSauKhuyenMai
                  ).toLocaleString("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  })}
                </div>
              )}
          </div>
        </>
      ),
    },
    {
      title: "Mã Sản Phẩm",
      align: "center",
      key: "ma",
      width: "10%",
      dataIndex: "ma",
      render: (text, record) => (
        <span style={{ fontWeight: "400" }}>
          {"SP0000000" + products.indexOf(record) + 1}
        </span>
      ),
    },
    {
      title: "Tên Sản Phẩm",
      align: "center",
      key: "tenSanPham",
      width: "20%",
      dataIndex: "tenSanPham",
      render: (text, record) => (
        <span style={{ fontWeight: "400", whiteSpace: "pre-line" }}>
          {record.sanPham.tenSanPham +
            " " +
            record.ram.dungLuong +
            "/" +
            record.rom.dungLuong +
            "GB (" +
            record.mauSac.tenMauSac +
            ")"}
        </span>
      ),
    },
    {
      title: "Đơn Giá",
      align: "center",
      width: "11%",
      render: (text, record) => (
        <span className="txt-price" style={{ fontWeight: "400" }}>
          {record.donGia &&
            record.donGia.toLocaleString("vi-VN", {
              style: "currency",
              currency: "VND",
            })}
        </span>
      ),
    },
    {
      title: "Số Lượng",
      align: "center",
      width: "11%",
      render: (text, record) => (
        <Tooltip title="Danh sách IMEI" TransitionComponent={Zoom}>
          <div
            onClick={() => {
              setOpenModalImei(true);
              setImeis(record.imeis && record.imeis);
              const productName =
                record.sanPham.tenSanPham +
                " " +
                record.ram.dungLuong +
                "/" +
                record.rom.dungLuong +
                "GB" +
                " (" +
                record.mauSac.tenMauSac +
                ")";
              setProductName(productName);
            }}
            style={{ cursor: "pointer" }}
          >
            <span style={{ fontWeight: "400" }} className="underline-blue">
              {record.soLuongTonKho}
            </span>
          </div>
        </Tooltip>
      ),
    },
    {
      title: "Trạng Thái",
      align: "center",
      width: "15%",
      dataIndex: "trangThai",
      render: (type) =>
        type == 0 ? (
          <div
            className="rounded-pill mx-auto badge-success"
            style={{
              height: "35px",
              width: "96px",
              padding: "4px",
            }}
          >
            <span className="text-white" style={{ fontSize: "14px" }}>
              Kinh doanh
            </span>
          </div>
        ) : type === 1 ? (
          <div
            className="rounded-pill badge-primary mx-auto"
            style={{ height: "35px", width: "145px", padding: "4px" }}
          >
            <span className="text-white" style={{ fontSize: "14px" }}>
              Chưa kinh doanh
            </span>
          </div>
        ) : (
          <div
            className="rounded-pill badge-danger mx-auto"
            style={{ height: "35px", width: "150px", padding: "4px" }}
          >
            <span className="text-white" style={{ fontSize: "14px" }}>
              Ngừng kinh doanh
            </span>
          </div>
        ),
    },
    {
      title: "Thao Tác",
      align: "center",
      width: "15%",
      dataIndex: "ma",
      render: (text, record) => (
        <>
          <div className="button-container">
            <Tooltip title="Cập nhật" TransitionComponent={Zoom}>
              <IconButton
                onClick={() => {
                  setOpenUpdateProduct(true);
                  setRefreshUpdate([]);
                  setPriceProduct(record.donGia);
                  setStatusProduct(record.trangThai);
                  setIdProduct(record.id);
                }}
                size=""
                className="me-2"
              >
                <FaPencilAlt color="#2f80ed" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Import IMEI" TransitionComponent={Zoom}>
              <IconButton onClick={handleUploadClick} className="me-2">
                <FaUpload color="#2f80ed" />
                <input
                  style={{ display: "none" }}
                  ref={inputRef}
                  type="file"
                  name="file"
                  className="custom-file-input"
                  id="inputGroupFile"
                  required
                  onChange={handleImport}
                  accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                />
              </IconButton>
            </Tooltip>
          </div>
        </>
      ),
    },
  ];
  return (
    <>
      <div
        className="mt-4"
        style={{
          backgroundColor: "#ffffff",
          boxShadow: "0 0.1rem 0.3rem #00000010",
        }}
      >
        <Card className="">
          <Card.Header className="d-flex justify-content-between">
            <div className="header-title mt-2">
              <TextField
                label="Tìm theo mã, tên, số lượng hoặc đơn giá"
                // onChange={handleGetValueFromInputTextField}
                // value={keyword}
                InputLabelProps={{
                  sx: {
                    marginTop: "",
                    // textTransform: "capitalize",
                  },
                }}
                inputProps={{
                  style: {
                    height: "23px",
                    width: "400px",
                  },
                }}
                size="small"
                className=""
              />
              <Button
                // onClick={handleRefreshData}
                className="rounded-2 ms-2"
                type="warning"
                style={{ width: "100px", fontSize: "15px" }}
              >
                <span
                  className="text-dark"
                  style={{ fontWeight: "500", marginBottom: "2px" }}
                >
                  Làm Mới
                </span>
              </Button>
            </div>
            <div className="mt-2">
              <Button
                className="rounded-2 button-mui me-2"
                type="primary"
                style={{
                  height: "40px",
                  width: "auto",
                  fontSize: "15px",
                }}
              >
                <FaDownload
                  className="ms-1"
                  style={{
                    position: "absolute",
                    bottom: "13.5px",
                    left: "10px",
                  }}
                />
                <span
                  className="ms-3 ps-1"
                  style={{ marginBottom: "3px", fontWeight: "500" }}
                >
                  Export Excel
                </span>
              </Button>
            </div>
          </Card.Header>
          <div className="d-flex mt-4 mx-auto">
            <div
              className="d-flex ms-3"
              style={{
                height: "40px",
                position: "relative",
                cursor: "pointer",
              }}
            >
              <div
                // onClick={handleOpenSelect1}
                className=""
                style={{ marginTop: "8px" }}
              >
                <span
                  className="ms-2 ps-1"
                  style={{ fontSize: "15px", fontWeight: "450" }}
                >
                  RAM:{""}
                </span>
              </div>
              <FormControl
                sx={{
                  minWidth: 50,
                }}
                size="small"
              >
                <Select
                  MenuProps={{
                    PaperProps: {
                      style: {
                        borderRadius: "7px",
                      },
                    },
                  }}
                  IconComponent={KeyboardArrowDownOutlinedIcon}
                  sx={{
                    "& .MuiOutlinedInput-notchedOutline": {
                      border: "none !important",
                    },
                    "& .MuiSelect-select": {
                      color: "#2f80ed",
                      fontWeight: "500",
                    },
                  }}
                  // open={openSelect1}
                  // onClose={handleCloseSelect1}
                  // onOpen={handleOpenSelect1}
                  defaultValue={14}
                >
                  <MenuItem className="" value={14}>
                    Tất cả
                  </MenuItem>
                  <MenuItem value={15}>Khách hàng mới</MenuItem>
                  <MenuItem value={20}>Khách hàng cũ</MenuItem>
                </Select>
              </FormControl>
            </div>
            <div
              className="d-flex ms-3"
              style={{
                height: "40px",
                position: "relative",
                cursor: "pointer",
              }}
            >
              <div
                // onClick={handleOpenSelect1}
                className=""
                style={{ marginTop: "8px" }}
              >
                <span
                  className="ms-2 ps-1"
                  style={{ fontSize: "15px", fontWeight: "450" }}
                >
                  ROM:{""}
                </span>
              </div>
              <FormControl
                sx={{
                  minWidth: 50,
                }}
                size="small"
              >
                <Select
                  MenuProps={{
                    PaperProps: {
                      style: {
                        borderRadius: "7px",
                      },
                    },
                  }}
                  IconComponent={KeyboardArrowDownOutlinedIcon}
                  sx={{
                    "& .MuiOutlinedInput-notchedOutline": {
                      border: "none !important",
                    },
                    "& .MuiSelect-select": {
                      color: "#2f80ed",
                      fontWeight: "500",
                    },
                  }}
                  // open={openSelect1}
                  // onClose={handleCloseSelect1}
                  // onOpen={handleOpenSelect1}
                  defaultValue={14}
                >
                  <MenuItem className="" value={14}>
                    Tất cả
                  </MenuItem>
                  <MenuItem value={15}>Khách hàng mới</MenuItem>
                  <MenuItem value={20}>Khách hàng cũ</MenuItem>
                </Select>
              </FormControl>
            </div>
            <div
              className="d-flex ms-3"
              style={{
                height: "40px",
                position: "relative",
                cursor: "pointer",
              }}
            >
              <div
                // onClick={handleOpenSelect1}
                className=""
                style={{ marginTop: "8px" }}
              >
                <span
                  className="ms-2 ps-1"
                  style={{ fontSize: "15px", fontWeight: "450" }}
                >
                  Màu Sắc:{""}
                </span>
              </div>
              <FormControl
                sx={{
                  minWidth: 50,
                }}
                size="small"
              >
                <Select
                  MenuProps={{
                    PaperProps: {
                      style: {
                        borderRadius: "7px",
                      },
                    },
                  }}
                  IconComponent={KeyboardArrowDownOutlinedIcon}
                  sx={{
                    "& .MuiOutlinedInput-notchedOutline": {
                      border: "none !important",
                    },
                    "& .MuiSelect-select": {
                      color: "#2f80ed",
                      fontWeight: "500",
                    },
                  }}
                  // open={openSelect1}
                  // onClose={handleCloseSelect1}
                  // onOpen={handleOpenSelect1}
                  defaultValue={14}
                >
                  <MenuItem className="" value={14}>
                    Tất cả
                  </MenuItem>
                  <MenuItem value={15}>Khách hàng mới</MenuItem>
                  <MenuItem value={20}>Khách hàng cũ</MenuItem>
                </Select>
              </FormControl>
            </div>
            <div
              className="d-flex ms-3"
              style={{
                height: "40px",
                position: "relative",
                cursor: "pointer",
              }}
            >
              <div
                // onClick={handleOpenSelect1}
                className=""
                style={{ marginTop: "8px" }}
              >
                <span
                  className="ms-2 ps-1"
                  style={{ fontSize: "15px", fontWeight: "450" }}
                >
                  Trạng Thái:{""}
                </span>
              </div>
              <FormControl
                sx={{
                  minWidth: 50,
                }}
                size="small"
              >
                <Select
                  MenuProps={{
                    PaperProps: {
                      style: {
                        borderRadius: "7px",
                      },
                    },
                  }}
                  IconComponent={KeyboardArrowDownOutlinedIcon}
                  sx={{
                    "& .MuiOutlinedInput-notchedOutline": {
                      border: "none !important",
                    },
                    "& .MuiSelect-select": {
                      color: "#2f80ed",
                      fontWeight: "500",
                    },
                  }}
                  // open={openSelect1}
                  // onClose={handleCloseSelect1}
                  // onOpen={handleOpenSelect1}
                  defaultValue={14}
                >
                  <MenuItem className="" value={14}>
                    Tất cả
                  </MenuItem>
                  <MenuItem value={15}>Khách hàng mới</MenuItem>
                  <MenuItem value={20}>Khách hàng cũ</MenuItem>
                </Select>
              </FormControl>
            </div>
            <div
              className="d-flex ms-3"
              style={{
                height: "40px",
                position: "relative",
                cursor: "pointer",
              }}
            >
              <div
                // onClick={handleOpenSelect1}
                className=""
                style={{ marginTop: "8px" }}
              >
                <span
                  className="ms-2 ps-1"
                  style={{ fontSize: "15px", fontWeight: "450" }}
                >
                  Khoảng Giá:{""}
                </span>
              </div>
              <FormControl
                sx={{
                  minWidth: 50,
                }}
                size="small"
              >
                <Select
                  MenuProps={{
                    PaperProps: {
                      style: {
                        borderRadius: "7px",
                      },
                    },
                  }}
                  IconComponent={KeyboardArrowDownOutlinedIcon}
                  sx={{
                    "& .MuiOutlinedInput-notchedOutline": {
                      border: "none !important",
                    },
                    "& .MuiSelect-select": {
                      color: "#2f80ed",
                      fontWeight: "500",
                    },
                  }}
                  // open={openSelect1}
                  // onClose={handleCloseSelect1}
                  // onOpen={handleOpenSelect1}
                  defaultValue={14}
                >
                  <MenuItem className="" value={14}>
                    Tất cả
                  </MenuItem>
                  <MenuItem value={15}>Khách hàng mới</MenuItem>
                  <MenuItem value={20}>Khách hàng cũ</MenuItem>
                </Select>
              </FormControl>
            </div>
          </div>
          <div className="d-flex mt-3 mx-auto">
            <div
              className="d-flex"
              style={{
                height: "40px",
                position: "relative",
                cursor: "pointer",
              }}
            >
              <div
                // onClick={handleOpenSelect1}
                className=""
                style={{ marginTop: "8px" }}
              >
                <span
                  className="ms-2 ps-1"
                  style={{ fontSize: "15px", fontWeight: "450" }}
                >
                  Sắp Xếp:{""}
                </span>
              </div>
              <FormControl
                sx={{
                  minWidth: 50,
                }}
                size="small"
              >
                <Select
                  MenuProps={{
                    PaperProps: {
                      style: {
                        borderRadius: "7px",
                      },
                    },
                  }}
                  IconComponent={KeyboardArrowDownOutlinedIcon}
                  sx={{
                    "& .MuiOutlinedInput-notchedOutline": {
                      border: "none !important",
                    },
                    "& .MuiSelect-select": {
                      color: "#2f80ed",
                      fontWeight: "500",
                    },
                  }}
                  // open={openSelect1}
                  // onClose={handleCloseSelect1}
                  // onOpen={handleOpenSelect1}
                  defaultValue={14}
                >
                  <MenuItem className="" value={14}>
                    Tất cả
                  </MenuItem>
                  <MenuItem value={15}>Khách hàng mới</MenuItem>
                  <MenuItem value={20}>Khách hàng cũ</MenuItem>
                </Select>
              </FormControl>
            </div>
            <div
              className="d-flex ms-3"
              style={{
                height: "40px",
                position: "relative",
                cursor: "pointer",
              }}
            >
              <div
                // onClick={handleOpenSelect1}
                className=""
                style={{ marginTop: "8px" }}
              >
                <span
                  className="ms-2 ps-1"
                  style={{ fontSize: "15px", fontWeight: "450" }}
                >
                  Hiển Thị:{""}
                </span>
              </div>
              <FormControl
                sx={{
                  minWidth: 50,
                }}
                size="small"
              >
                <Select
                  MenuProps={{
                    PaperProps: {
                      style: {
                        borderRadius: "7px",
                      },
                    },
                  }}
                  IconComponent={KeyboardArrowDownOutlinedIcon}
                  sx={{
                    "& .MuiOutlinedInput-notchedOutline": {
                      border: "none !important",
                    },
                    "& .MuiSelect-select": {
                      color: "#2f80ed",
                      fontWeight: "500",
                    },
                  }}
                  // open={openSelect1}
                  // onClose={handleCloseSelect1}
                  // onOpen={handleOpenSelect1}
                  defaultValue={14}
                >
                  <MenuItem className="" value={14}>
                    Tất cả
                  </MenuItem>
                  <MenuItem value={15}>Khách hàng mới</MenuItem>
                  <MenuItem value={20}>Khách hàng cũ</MenuItem>
                </Select>
              </FormControl>
            </div>
          </div>
          <Card.Body>
            <OrderTable />
          </Card.Body>
          <div className="mx-auto">
            <Pagination
              color="primary" /* page={parseInt(currentPage)} key={refreshPage} count={totalPages} */
              // onChange={handlePageChange}
            />
          </div>
          <div className="mt-4"></div>
        </Card>
      </div>
      {isLoading && <LoadingIndicator />}

      <ModalUpdateProduct
        priceProduct={priceProduct}
        statusProduct={statusProduct}
        open={openUpdateProduct}
        close={handleCloseOpenUpdateProduct}
        update={handleUpdateProduct}
      />

      <ImportAndExportExcelImei
        open={openModalImel}
        close={handleCloseModalImei}
        imeis={imeis}
        productName={productName}
        view={false}
      />
    </>
  );
};
export default ManagementProductItems;
