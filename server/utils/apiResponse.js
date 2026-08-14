class ApiResponse {
  static success(res, data = null, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  static created(res, data = null, message = 'Resource created', statusCode = 201) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  static paginated(res, items = [], pagination = {}, message = 'Success') {
    return res.status(200).json({
      success: true,
      message,
      data: items,
      pagination,
    });
  }
}

module.exports = ApiResponse;
