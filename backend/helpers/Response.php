<?php

class Response {

    public static function success($data = null, string $message = 'Success', int $code = 200): void {
        http_response_code($code);
        $response = ['success' => true, 'message' => $message];
        if ($data !== null) {
            $response['data'] = $data;
        }
        echo json_encode($response);
        exit;
    }

    public static function error(string $message = 'Error', int $code = 400, $errors = null): void {
        http_response_code($code);
        $response = ['success' => false, 'message' => $message];
        if ($errors !== null) {
            $response['errors'] = $errors;
        }
        echo json_encode($response);
        exit;
    }

    public static function paginated(array $data, int $total, int $page, int $perPage, string $message = 'Success'): void {
        http_response_code(200);
        echo json_encode([
            'success'    => true,
            'message'    => $message,
            'data'       => $data,
            'pagination' => [
                'total'        => $total,
                'per_page'     => $perPage,
                'current_page' => $page,
                'last_page'    => (int) ceil($total / $perPage),
            ],
        ]);
        exit;
    }
}
